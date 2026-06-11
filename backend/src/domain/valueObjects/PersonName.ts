const NAME_REGEX = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]{2,50}$/;

export class PersonName {
    readonly firstName: string;
    readonly lastName: string;

    constructor(firstName: string, lastName: string) {
        if (!NAME_REGEX.test(firstName)) {
            throw new Error('Invalid name');
        }
        if (!NAME_REGEX.test(lastName)) {
            throw new Error('Invalid name');
        }
        this.firstName = firstName;
        this.lastName = lastName;
    }

    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    equals(other: PersonName): boolean {
        return this.firstName === other.firstName && this.lastName === other.lastName;
    }
}
