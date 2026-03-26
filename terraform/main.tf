#keys
resource "aws_key_pair" "ec2-key" {
  key_name   = "rapidbase_ssh_key"
  public_key = file("rapidbase_ssh_key.pub")
  tags = {
    Name = "rapidbase_ssh_key"
  }
}
#vpc && security
resource "aws_default_vpc" "default" {

}

resource "aws_security_group" "rapidbase_sg" {
  name        = "rapidbase_sg"
  description = "this is a security group using terraform"
  vpc_id      = aws_default_vpc.default.id
  ingress {
    protocol    = "tcp"
    from_port   = 22
    to_port     = 22
    cidr_blocks = ["0.0.0.0/0"]
    description = "open for ssh"
  }
  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
    description = "open for http"
  }
  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
    description = "open all inbounds"
  }
  tags = {
    Name = "${var.env}-ec2"
  }
}

# instance
resource "aws_instance" "rapidbase_ec2" {
  key_name        = aws_key_pair.rapidbase_ssh_key.key_name
  security_groups = [aws_security_group.rapidbase_sg.name]
  ami             = var.ami_id
  instance_type = var.instance_type
  user_data = file("../scripts/install_docker.sh")

  root_block_device {
    volume_size = var.root_storage
    volume_type = "gp3"
  }
  tags = {
    Name = "rapidbase_ec2"
  }
}
resource "aws_ec2_instance_state" "all_servers_state" {
  instance_id = aws_instance.rapidbase_ec2.id
  state       = "running"
}
