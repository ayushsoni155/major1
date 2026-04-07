# 1. SSH Key Pair
resource "aws_key_pair" "rapidbase_ssh_key" {
  key_name   = "rapidbase_ssh_key"
  public_key = file("../rapidbase_ssh_key.pub")
  tags = {
    Name = "rapidbase_ssh_key"
  }
}

# 2. Networking (Default VPC)
resource "aws_default_vpc" "default" {}

# 3. Security Group
resource "aws_security_group" "rapidbase_sg" {
  name        = "rapidbase_sg"
  description = "Security group using terraform for rapidbase"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    protocol    = "tcp"
    from_port   = 22
    to_port     = 22
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  ingress {
    protocol    = "tcp"
    from_port   = 5050
    to_port     = 5050
    cidr_blocks = ["0.0.0.0/0"]
    description = "postgresAdmin"
  }

  ingress {
    protocol    = "tcp"
    from_port   = 8001
    to_port     = 8001
    cidr_blocks = ["0.0.0.0/0"]
    description = "redisAdmin"
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "rapidbase_sg"
  }
}

# 4. EC2 Instance
resource "aws_instance" "rapidbase_ec2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.rapidbase_ssh_key.key_name
  vpc_security_group_ids = [aws_security_group.rapidbase_sg.id]
  user_data              = file("../scripts/install_docker.sh")

  root_block_device {
    volume_size = var.root_storage
    volume_type = "gp3"
  }

  tags = {
    Name = "rapidbase_ec2"
  }
}

# 5. Elastic IP
resource "aws_eip" "my_static_ip" {
  instance = aws_instance.rapidbase_ec2.id
  domain   = "vpc"

  tags = {
    Name = "rapidbase-EIP"
  }
}

# 6. Instance State (Optional, but kept as per your request)
resource "aws_ec2_instance_state" "all_servers_state" {
  instance_id = aws_instance.rapidbase_ec2.id
  state       = "running"
}    


