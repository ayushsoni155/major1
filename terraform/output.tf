# 1. The Static IP (Use this for your GitHub Secret: EC2_HOST)
output "rapidbase_public_ip" {
  value       = aws_eip.my_static_ip.public_ip
  description = "The static public IP of the Rapidbase EC2"
}

# 2. The Static Public DNS
output "rapidbase_public_dns" {
  value       = aws_eip.my_static_ip.public_dns
  description = "The public DNS associated with the Elastic IP"
}