import { describe, expect, it } from "vitest";
import { decryptBackup, encryptBackup } from "../src/core";

describe("Encrypted backups", () => {
  it("round-trips data with AES-GCM", async () => {
    const backup = await encryptBackup({ caseId:"ABS-1", verdict:"YES" },"secret-passphrase");
    const restored = await decryptBackup<{caseId:string;verdict:string}>(backup,"secret-passphrase");
    expect(restored.caseId).toBe("ABS-1");
    expect(restored.verdict).toBe("YES");
  });
});
