export class CryptoUtil {
  /**
   * 使用 PBKDF2 (100,000 次迭代) 進行密碼雜湊
   */
  static async hashPassword(password, saltHex = null) {
    const enc = new TextEncoder();
    const salt = saltHex 
      ? new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
      : window.crypto.getRandomValues(new Uint8Array(16));

    const keyMaterial = await window.crypto.subtle.importKey(
      "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const exported = await window.crypto.subtle.exportKey("raw", derivedKey);
    const hashHex = Array.from(new Uint8Array(exported)).map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHexStr = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

    return { hash: hashHex, salt: saltHexStr };
  }

  /**
   * 驗證密碼
   */
  static async verifyPassword(password, storedHash, storedSalt) {
    const { hash } = await this.hashPassword(password, storedSalt);
    return hash === storedHash;
  }
}
