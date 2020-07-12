#!/usr/bin/env node

const request = require("request")
const core = require("@actions/core");
const { context, github } = require("@actions/github");

function getSha() {
    if (context.eventName == "pull_request") {
        return context.payload.pull_request.head.sha;
    } else {
        return context.sha;
    }
}

async function run() {
    const { USER } = process.env;
    if (!USER) {
            core.setFailed('USER must be supplied as an environment variable');
            return;
    }

    core.debug("user is: " + USER);
    const url = core.getInput("auth_url", { required: true });

    await request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200 &&
            body.authorized_users.length > 0) {
            // response was valid, check user
            if (body.authorized_users.includes(USER)) {
                // authorized user
                core.setOutput("authorized", 'true');
                return;
            }

            // unauthorized
            unauthorized(USER + " is not authorized to run CI");
        } else {
            unauthorized("CI couldn't provide a list of authorized users");
        }
    })
}

function unauthorized(message) {
    const { GITHUB_TOKEN } = process.env;
    const octokit = github.getOctokit(GITHUB_TOKEN);
    const sha = getSha();
    const [owner, repo] = core.getInput("repository").split("/");

    core.debug(repository);

    var body = ">" + (context.eventName === "issue_comment"
            ? context.payload.comment.body
            : 'Response to PR creation') + "\n";

    core.debug(body);

    // create the comment on github
    octokit.repos.createCommitComment({
      owner: owner,
      repo: repo,
      commit_sha: sha,
      body: body + message,
    });

    core.setOutput("authorized", "false");
    core.setFailed("Failed with: " + message);
}

run().catch(err => {
    console.error(err);
    core.setFailed("Unexpected error");
});
