terraform {

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.26.0"
    }
  }
  required_version = "1.2.7"
  backend "s3" {
    bucket         = "terraform-state-914192791839-eu-central-1"
    key            = "walkthrough-cameron.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "terraform-state-lock-914192791839-eu-central-1"
  }
}

provider "aws" {
  region = var.region
}
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
