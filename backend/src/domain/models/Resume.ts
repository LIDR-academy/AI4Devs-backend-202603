export class Resume {
    id?: number;
    candidateId?: number;
    filePath: string;
    fileType: string;
    uploadDate: Date;

    constructor(data: any) {
        this.id = data?.id;
        this.candidateId = data?.candidateId;
        this.filePath = data?.filePath;
        this.fileType = data?.fileType;
        this.uploadDate = data?.uploadDate ? new Date(data.uploadDate) : new Date();
    }
}
