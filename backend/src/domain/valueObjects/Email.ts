const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export class Email {
    readonly value: string;

    constructor(value: string) {
        if (!EMAIL_REGEX.test(value)) {
            throw new Error('Invalid email');
        }
        this.value = value.toLowerCase();
    }

    equals(other: Email): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
