# Serverless.com and Terraform template

## Prerequesites
* [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager)
* [tfenv](https://github.com/tfutils/tfenv) (Terraform Version Manager)
* [Leapp](https://www.leapp.cloud/): Manage AWS credentials easier
## Project Structure

### packages/service
* [Serverless.com](https://serverless.com) project
* Language: Typescript

#### packages/service/src
Holds all the Source code for [Lambda](https://aws.amazon.com/lambda/) 

### packages/resources
Resources managed outside serverless.

#### packages/resources/terraform
Resources managed by [Terraform](https://www.terraform.io/).

## Deploy
Using Leapp, populate your `~/.aws/credentials` for the _default_ profile. Alternatively, you can copy the credentials from the [AWS SSO login page](https://interviewme.awsapps.com/start).

Credentials obtained from `aws sso login` won't work with `terraform` or. `sls`

```bash
export STAGE=dev
export AWS_PROFILE=default
cd packages/resources/terraform
terraform init
terraform apply
terraform output -json > ../../service/resources/terraform.json
cd ../../service
npm install
npm run lint
npx sls deploy
```
