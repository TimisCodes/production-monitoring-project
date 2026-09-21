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
}