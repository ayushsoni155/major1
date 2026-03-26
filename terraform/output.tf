output "public_ip" {
  value = aws_instance.ec2-instance.public_ip
}
output "public_dns" {
  value = aws_instance.ec2-instance.public_dns
}