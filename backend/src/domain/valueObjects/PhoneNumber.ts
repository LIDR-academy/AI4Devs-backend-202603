const PHONE_REGEX = /^(6|7|9)\d{8}$/;

export class PhoneNumber {
    readonly value: string;

    constructor(value: string) {
        if (!PHONE_REGEX.test(value)) {
            throw new Error('Invalid phone');
        }
        this.value = value;
    }

    equals(other: PhoneNumber): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
