import { Octokit } from "octokit";
import { config } from  'dotenv'

config();

// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
const octokit = new Octokit({ auth: process.env.RELEASE });

const rc = "-rc.";

async function main() {
  try {
    const {
      data: { tag_name },
    } = await octokit.rest.repos.getLatestRelease({
      repo: "toolbox",
      owner: "frontendara",
    });

    const [currentVersion, currentRCReleaseString] = tag_name.split(rc);
    const currentRCReleaseNumber = Number(currentRCReleaseString);
    const nextRCReleaseNumber = currentRCReleaseNumber + 1;
    const nextCRReleaseTag = `${currentVersion}${rc}${nextRCReleaseNumber}`;

    console.log({ tag_name, nextRCReleaseNumber, nextCRReleaseTag });

    const { data } = await octokit.rest.repos.createRelease({
      repo: "toolbox",
      owner: "frontendara",
      tag_name: nextCRReleaseTag,
    });
    console.log(data.url)
  } catch (error) {
    console.error(error);
  }
}

main();
