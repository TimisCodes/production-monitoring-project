<<<<<<< HEAD
output "instance_public_ips" {
  description = "Public IP addresses of the managed nodes"
  value       = aws_instance.app_nodes[*].public_ip
}

output "security_group_id" {
  description = "ID of the created gadget-sg security group"
  value       = aws_security_group.server_sg.id
}

# Formatted output to paste directly into your Ansible hosts inventory file
output "ansible_inventory_format" {
  description = "Inventory entries for Ansible"
  value = [
    for instance in aws_instance.app_nodes :
    "${instance.tags.Name} ansible_host=${instance.public_ip} ansible_user=ubuntu"
  ]
=======
output "default_vpc_id" {
  description = "Default VPC ID"
  value       = data.aws_vpc.default.id
}

output "security_group_id" {
  description = "GadgetStore security group ID"
  value       = aws_security_group.gadgetstore_sg.id
}

output "security_group_name" {
  description = "GadgetStore security group name"
  value       = aws_security_group.gadgetstore_sg.name
>>>>>>> ac15910dd4f234861b800935865b96fe409284c7
}