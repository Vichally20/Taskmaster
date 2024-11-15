import crypto from 'node:crypto';

const hashToken = (token) => {
    //create a hash object

    return crypto.createHash("sha256").update(token.toString()).digest("hex");
};

export default hashToken;