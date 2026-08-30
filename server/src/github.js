const API_BASE = "https://api.github.com";

class GitHubError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

function contentsUrl(filePath) {
  const { GITHUB_OWNER, GITHUB_REPO } = process.env;
  return `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
}

// Returns { sha, content } or null if the file doesn't exist yet.
async function getFile(filePath) {
  const branch = process.env.GITHUB_BRANCH;
  const res = await fetch(`${contentsUrl(filePath)}?ref=${encodeURIComponent(branch)}`, {
    headers: ghHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubError(`GitHub kon ${filePath} niet ophalen (${res.status})`, res.status);
  const data = await res.json();
  return { sha: data.sha, content: Buffer.from(data.content, "base64").toString("utf-8") };
}

async function putFile({ path: filePath, contentBuffer, sha, message }) {
  const branch = process.env.GITHUB_BRANCH;
  const body = { message, content: contentBuffer.toString("base64"), branch };
  if (sha) body.sha = sha;
  const res = await fetch(contentsUrl(filePath), {
    method: "PUT",
    headers: ghHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new GitHubError(`GitHub kon ${filePath} niet opslaan (${res.status})`, res.status);
  return res.json();
}

module.exports = { getFile, putFile, GitHubError };
