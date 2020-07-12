#!/usr/bin/env node

const request = require("request")
const core = require("@actions/core");
const { context, GitHub } = require("@actions/github");

async function run() {
    const { USER } = process.env;
    if (!USER) {
            core.setFailed('USER must be supplied as an environment variable');
            return;
    }

    console.log("User is " + USER);
    const url = core.getInput("auth_url", { required: true });

    await request({
            url: url,
            json: true
    }, function (error, response, body) {
            if (!error && response.statusCode === 200 &&
                    body.authorized_users.length > 0) {
                    // response was valid, check user
                    var present = body.authorized_users.includes(USER);
                    core.setOutput("authorized", present.toString());
            } else {
                    console.log("Authentication URL returned no response");
                    core.setOutput("authorized", "false");
            }
    })
}

run().catch(err => {
    console.error(err);
    core.setFailed("Unexpected error");
});
