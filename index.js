#!/usr/bin/env node

const request = require("request")
const core = require("@actions/core");
const github = require("@actions/github");

function getSha() {
    if (github.context.eventName == "pull_request") {
        return github.context.payload.pull_request.head.sha;
    } else {
        return github.context.sha;
    }
}

async function run() {
    const { USER } = process.env;
    if (!USER) {
            core.setFailed('USER must be supplied as an environment variable');
            return;
    }

    core.debug("user is: " + USER); const url = core.getInput("auth_url", { required: true });

    await request({ url: url,
        json: true
    }, function (error, response, body) {
        if (error) {
            unauthorized("CI couldn't provide a list of authorized users", github);
            reject(error);
        } else if (response.statusCode === 200 &&
            body.authorized_users.length > 0) {
            // response was valid, check user
            if (body.authorized_users.includes(USER)) {
                // authorized user
                core.setOutput("authorized", 'true');
            } else {
                // unauthorized
                unauthorized(USER + " is not authorized to run CI", github);
            }

            resolve(body);
        } else {
            unauthorized("Unhandled error came in", github);
            reject(response);
        }
    })
}

async function createComment(owner, repo, sha, body, octokit) {
    await octokit.repos.createCommitComment({
      owner: owner,
      repo: repo,
      commit_sha: sha,
      body: body + message,
    });
}

function unauthorized(message, github) {
    const { GITHUB_TOKEN } = process.env;
    const octokit = github.getOctokit(GITHUB_TOKEN);
    const sha = getSha();
    const [owner, repo] = core.getInput("repository").split("/");

    var body = ">" + (github.context.eventName === "issue_comment"
            ? github.context.payload.comment.body
            : 'Response to PR creation') + "\n";

    core.debug(body);

    // create the comment on github
    createComment(owner, repo, sha, body + message, octokit).catch(err => {
        console.error(err);
        core.setFailed("Unexpected error creating comment");
    }

    core.setOutput("authorized", "false");
    core.setFailed("Failed with: " + message);
}

run().catch(err => {
    console.error(err);
    core.setFailed("Unexpected error");
});
