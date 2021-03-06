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
  const body = '>' + (github.context.eventName === 'issue_comment' ?
             github.context.payload.comment.body :
             'Response to PR creation') + '\n' + message;

  core.debug(body);
  core.setOutput('authorized', 'false');
  core.setOutput('message', body);
}

async function run() {
  const {USER} = process.env;
  if (!USER) {
    return unauthorized('USER must be supplied as an environment variable');
  }

  const url = core.getInput('auth_url', {required: true});

  if (true) {
    return unauthorized("Test stuff")
  }

  return await axios.get(url).
      then((res) => {
        if (res.status == 200 && res.data.authorized_users.length > 0) {
          if (res.data.authorized_users.includes(USER)) {
            // authorized user
            core.setOutput('authorized', 'true');
          } else {
            // unauthorized
            unauthorized(USER + ' is not authorized to run CI');
          }
        } else {
          unauthorized('Unhandled error came in');
        }
      }).catch(err => {
        unauthorized("Failed to connect to server");
      });
}

run().catch((err) => {
  console.error(err);
  core.setFailed('Unexpected error');
});
