import { ObjectId } from "mongodb";

export enum Profile {
    RESIDENT = 0,
    COUNSELOR = 1,
    MANAGER = 2
}

export default class Resident {

    _id?: ObjectId;
    wallet: string;
    name: string;
    phone?: string;
    email?: string;
    profile: Profile;

    constructor(
        wallet: string,
        name: string,
        profile: Profile = Profile.RESIDENT,
        phone?: string,
        email?: string
    ) {
        this.wallet = wallet;
        this.name = name;
        this.profile = profile;
        this.phone = phone;
        this.email = email;
    }

}