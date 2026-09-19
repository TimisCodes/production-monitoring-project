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
}