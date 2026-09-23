<<<<<<< HEAD
=======
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
    }
  }

  required_version = ">= 1.5.0"
}

>>>>>>> ac15910dd4f234861b800935865b96fe409284c7
provider "aws" {
  region = var.aws_region
}