import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import candidateRoutes from './routes/candidateRoutes';
import positionRoutes from './routes/positionRoutes';
import { uploadFile } from './application/services/fileUploadService';
import cors from 'cors';

// Extender la interfaz Request para incluir prisma
declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
    }
  }
}

dotenv.config();
const prisma = new PrismaClient();

export const app = express();
export default app;

// Middleware para parsear JSON. Asegúrate de que esto esté antes de tus rutas.
app.use(express.json());

// Middleware para adjuntar prisma al objeto de solicitud
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Middleware para permitir CORS desde http://localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Import and use candidateRoutes
app.use('/candidates', candidateRoutes);
app.use('/positions', positionRoutes);

// Route for file uploads
app.post('/upload', uploadFile);

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const port = 3010;

app.get('/', (req, res) => {
  res.send('Hola LTI!');
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.type('text/plain'); 
  res.status(500).send('Something broke!');
});

// #region agent log
fetch('http://127.0.0.1:7939/ingest/083974bf-0a69-4d90-b7b9-11a4ba0f3db1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30e2da'},body:JSON.stringify({sessionId:'30e2da',runId:'pre-fix',hypothesisId:'H1-H4',location:'index.ts:listen-before',message:'Attempting to bind server',data:{port,processId:process.pid,processTitle:process.title},timestamp:Date.now()})}).catch(()=>{});
// #endregion

const server = app.listen(port, () => {
  // #region agent log
  fetch('http://127.0.0.1:7939/ingest/083974bf-0a69-4d90-b7b9-11a4ba0f3db1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30e2da'},body:JSON.stringify({sessionId:'30e2da',runId:'pre-fix',hypothesisId:'H2',location:'index.ts:listen-success',message:'Server bound successfully',data:{port,processId:process.pid},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  console.log(`Server is running at http://localhost:${port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  // #region agent log
  fetch('http://127.0.0.1:7939/ingest/083974bf-0a69-4d90-b7b9-11a4ba0f3db1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30e2da'},body:JSON.stringify({sessionId:'30e2da',runId:'pre-fix',hypothesisId:'H1-H3-H5',location:'index.ts:listen-error',message:'Server bind failed',data:{port,processId:process.pid,errorCode:err.code,errorMessage:err.message,syscall:err.syscall},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing server before running npm start.`);
    console.error('On Windows, find the process with: netstat -ano | findstr :3010');
  } else {
    console.error(err);
  }
  process.exit(1);
});
