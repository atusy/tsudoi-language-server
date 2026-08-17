import { readDictionaryFile, type DictionaryFileVersion } from "./memory.ts";

interface RefreshMessage {
  readonly files: readonly string[];
  readonly versions: readonly DictionaryFileVersion[];
}

interface WorkerScope {
  addEventListener(type: "message", listener: (event: MessageEvent<RefreshMessage>) => void): void;
  close(): void;
  postMessage(message: unknown): void;
}

const scope = globalThis as unknown as WorkerScope;

scope.addEventListener("message", (event) => {
  void refresh(event.data);
});

async function refresh(message: RefreshMessage): Promise<void> {
  const versions = new Map(message.versions.map((file) => [file.path, file.contentHash]));
  const files = [];
  const errors: Array<{ path: string; message: string }> = [];
  for (const path of message.files) {
    try {
      const file = await readDictionaryFile(path, versions.get(path));
      if (file !== undefined) {
        files.push(file);
      }
    } catch (error) {
      errors.push({ path, message: String(error) });
    }
  }
  scope.postMessage({ type: "done", files, errors });
  scope.close();
}
