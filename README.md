# kin-node-agora

API leveraging the Kin-Node SDK.

This example Node API will show basic usage for creating accounts, submitting payments, submitting batch earns, checking balances, checking transacaction data and receiving Sign and Event webhook calls.

Setup:

- Clone the repo
- run "npm install" in your local directory
- create a .env file in /src with your whitelisted key, appindex, and webhook secret

prodPrivate='your whitelisted key here'

appIndex=your app index here

webhook_secret=your webhook secret here

Start:

Navigate to main project directory in terminal
Run "node /src/app.js"

Testing:

You can use Postman to test your endpoints to make sure everything is working properly

Notes:

- This repo is still a work in progress
- This repo is meant to be used as an example and not meant for a production environment
- This repo does not use a database
- This repo does not contain any sort of security

This is a good barebones starting point for understanding how to use the SDK. Enjoy!