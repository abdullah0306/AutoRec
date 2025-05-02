import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";

export async function verifyUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const isPasswordValid = await compare(password, user.hashed_password);
  if (!isPasswordValid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    is_active: user.is_active,
  };
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}) {
  const hashedPassword = await hash(data.password, 12);
  
  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      hashed_password: hashedPassword,
      first_name: data.first_name,
      last_name: data.last_name,
    },
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    is_active: user.is_active,
  };
}
