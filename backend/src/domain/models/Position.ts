export class Position {
    id?: number;
    companyId: number;
    interviewFlowId: number;
    title: string;
    description: string;
    status: string;
    isVisible: boolean;
    location: string;
    jobDescription: string;
    requirements?: string;
    responsibilities?: string;
    salaryMin?: number;
    salaryMax?: number;
    employmentType?: string;
    benefits?: string;
    companyDescription?: string;
    applicationDeadline?: Date;
    contactInfo?: string;

    constructor(data: any) {
        this.id = data.id;
        this.companyId = data.companyId;
        this.interviewFlowId = data.interviewFlowId;
        this.title = data.title;
        this.description = data.description;
        this.status = data.status ?? 'Draft';
        this.isVisible = data.isVisible ?? false;
        this.location = data.location;
        this.jobDescription = data.jobDescription;
        this.requirements = data.requirements;
        this.responsibilities = data.responsibilities;
        this.salaryMin = data.salaryMin;
        this.salaryMax = data.salaryMax;
        this.employmentType = data.employmentType;
        this.benefits = data.benefits;
        this.companyDescription = data.companyDescription;
        this.applicationDeadline = data.applicationDeadline ? new Date(data.applicationDeadline) : undefined;
        this.contactInfo = data.contactInfo;
    }
}
