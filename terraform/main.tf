<<<<<<< HEAD
# ==========================================
# 2. EC2 INSTANCES
# ==========================================
resource "aws_instance" "app_nodes" {
  count         = 2
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.server_sg.id]

  # User data script ensures Python 3 is ready for Ansible execution
  user_data = <<-EOF
              #!/bin/bash
              sudo apt-get update -y
              sudo apt-get install -y python3 python3-pip
              EOF

  tags = {
    Name = "gadget-node-${count.index + 1}"
    Role = "ansible-managed-node"
=======
# Get the default VPC
data "aws_vpc" "default" {
  default = true
}

# Security Group
resource "aws_security_group" "gadgetstore_sg" {
  name        = "gadgetstore-sg"
  description = "Security group for GadgetStore EC2"
  vpc_id      = data.aws_vpc.default.id

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # GadgetStore Docker port
  ingress {
    description = "GadgetStore"
    from_port   = 9808
    to_port     = 9808
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "gadgetstore-sg"
    Environment = "production"
    Project     = "gadgetstore"
>>>>>>> ac15910dd4f234861b800935865b96fe409284c7
  }
}