#!/usr/bin/env node

const axios = require('axios');
const core = require('@actions/core');
const github = require('@actions/github');

function getSha() {
  if (github.context.eventName == 'pull_request') {
    return github.context.payload.pull_request.head.sha;
  } else {
    return github.context.sha;
  }
}

function unauthorized(message) {
  const {GITHUB_TOKEN} = process.env;
  const octokit = github.getOctokit(GITHUB_TOKEN);
  const sha = getSha();
  const [owner, repo] = core.getInput('repository').split('/');

  //  const body = '>' + (github.context.eventName === 'issue_comment' ?
  //            github.context.payload.comment.body :
  //            'Response to PR creation') + '\n';
  const body = 'HELp';

  core.debug(body);

  core.setOutput('authorized', 'false');
  core.setFailed('Failed with: ' + message);

  // create the comment on github
  octokit.repos.createCommitComment({
    owner: owner,
    repo: repo,
    commit_sha: sha,
    body: body + message,
  });
}

async function run() {
  // const {USER} = process.env;
  USER = 'kevindweb';
  if (!USER) {
    core.setFailed('USER must be supplied as an environment variable');
    return;
  }

  core.debug('user is: ' + USER);
  // const url = core.getInput('auth_url', {required: true});
  const url = 'http://nimbus.seas.gwu.edu/ci-test/auth';

  axios.get(url).
      then((res) => {
        if (res.status == 200 && res.data.authorized_users.length > 0) {
          if (res.data.authorized_users.includes(USER)) {
          // authorized user
            core.setOutput('authorized', 'true');
          } else {
          // unauthorized
            console.log(' is not authorized to run CI');
          }
        } else {
          console.log('Unhandled error came in');
        }
      }).catch((err) => {
        console.log(err);
      });
}

run().catch((err) => {
  console.error(err);
  core.setFailed('Unexpected error');
});
