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
  }
}