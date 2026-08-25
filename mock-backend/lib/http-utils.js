"use strict";

function sendJson(res, status, data) {
  const body = data === undefined ? "" : JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function readRawBody(req, limitBytes = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new HttpError(413, "Arquivo/corpo da requisição excede o limite permitido"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJsonBody(req) {
  const raw = await readRawBody(req);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    throw new HttpError(400, "JSON inválido no corpo da requisição");
  }
}

/**
 * Parser mínimo de multipart/form-data (sem dependências). Suficiente para
 * o caso de uso real deste app: um único arquivo no campo "file".
 */
function parseMultipart(buffer, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  const boundary = boundaryMatch ? boundaryMatch[1] || boundaryMatch[2] : null;
  if (!boundary) throw new HttpError(400, "Content-Type multipart sem boundary");

  const boundaryBuf = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = buffer.indexOf(boundaryBuf);
  while (start !== -1) {
    const next = buffer.indexOf(boundaryBuf, start + boundaryBuf.length);
    if (next === -1) break;
    let part = buffer.slice(start + boundaryBuf.length, next);
    // remove CRLF de borda
    if (part.slice(0, 2).toString() === "\r\n") part = part.slice(2);
    if (part.slice(-2).toString() === "\r\n") part = part.slice(0, -2);
    if (part.length && part.toString("latin1") !== "--") parts.push(part);
    start = next;
  }

  const fields = {};
  const files = {};
  for (const part of parts) {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;
    const headerText = part.slice(0, headerEnd).toString("utf8");
    const content = part.slice(headerEnd + 4);

    const nameMatch = /name="([^"]+)"/i.exec(headerText);
    const filenameMatch = /filename="([^"]*)"/i.exec(headerText);
    const typeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headerText);
    const fieldName = nameMatch ? nameMatch[1] : null;
    if (!fieldName) continue;

    if (filenameMatch) {
      files[fieldName] = {
        filename: filenameMatch[1] || "arquivo",
        mimetype: typeMatch ? typeMatch[1].trim() : "application/octet-stream",
        buffer: content,
      };
    } else {
      fields[fieldName] = content.toString("utf8");
    }
  }
  return { fields, files };
}

module.exports = { sendJson, HttpError, readRawBody, readJsonBody, parseMultipart };
