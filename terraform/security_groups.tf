# ==========================================
# 1. SECURITY GROUP
# ==========================================
resource "aws_security_group" "server_sg" {
  name        = "server-sg"
  description = "Security group for Gadget app nodes and Ansible connectivity"

  # Allow SSH access (Port 22) for Ansible management
  ingress {
    description = "SSH for Ansible"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ansible_server_ip] # Restrict to Ansible Control Node IP
  }

  # Allow HTTP access for web application (Port 80)
  ingress {
    description = "HTTP Web Traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow custom App Port (e.g. 2301)
  #   ingress {
  #     description = "Gadget App Port"
  #     from_port   = 2301
  #     to_port     = 2301
  #     protocol    = "tcp"
  #     cidr_blocks = ["0.0.0.0/0"]
  #   }

  # Allow all outbound internet traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "server-sg"
  }
}