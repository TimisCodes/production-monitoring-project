variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "ami_id" {
  description = "AMI ID for Ubuntu 22.04 LTS"
  type        = string
  default     = "ami-0c7217cdde317cfec" # Update according to your region
}

variable "instance_type" {
  description = "EC2 Instance Type"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of the existing AWS Key Pair for SSH access"
  type        = string
}

variable "ansible_server_ip" {
  description = "Public IP of your Ansible main server (e.g., '203.0.113.10/32' or '0.0.0.0/0')"
  type        = string
  default     = "54.81.189.45/32"
}