"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateShareableLink;
function generateShareableLink(userId, length = 10) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomString = Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join("");
    const timeStamp = Date.now().toString(36);
    return `${userId.toLocaleString()}-${timeStamp}-${randomString}`;
}
