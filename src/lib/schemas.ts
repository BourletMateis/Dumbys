import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().check(z.minLength(6, "Mot de passe : 6 caractères min.")),
});

export const signUpSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().check(z.minLength(8, "Mot de passe : 8 caractères min.")),
});

export const createGroupSchema = z.object({
  name: z.string()
    .check(z.minLength(2, "Nom trop court (min. 2 car.)"))
    .check(z.maxLength(50, "Nom trop long (max. 50 car.)")),
  description: z.string().check(z.maxLength(200, "Description trop longue (max. 200 car.)")).optional(),
});

export const createChallengeSchema = z.object({
  title: z.string()
    .check(z.minLength(2, "Titre trop court (min. 2 car.)"))
    .check(z.maxLength(100, "Titre trop long (max. 100 car.)")),
  description: z.string().check(z.maxLength(300, "Description trop longue")).optional(),
});
