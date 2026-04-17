import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { env } from "./env";
import { prisma } from "./database";

export function configurePassport() {
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${env.API_URL}/api/auth/google/callback`,
          scope: ["profile", "email"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error("No email from Google"), undefined);

            let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

            if (!user) {
              user = await prisma.user.findUnique({ where: { email } });
              if (user) {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: { googleId: profile.id },
                });
              } else {
                const firstName = profile.name?.givenName ?? profile.displayName.split(" ")[0] ?? "";
                const lastName = profile.name?.familyName ?? profile.displayName.split(" ").slice(1).join(" ") ?? "";
                const avatarUrl = profile.photos?.[0]?.value ?? null;

                user = await prisma.user.create({
                  data: {
                    email,
                    googleId: profile.id,
                    firstName,
                    lastName,
                    avatarUrl,
                    role: "CLIENT",
                    needsProfileCompletion: true,
                    clientProfile: { create: {} },
                  },
                });
              }
            }

            return done(null, user);
          } catch (err) {
            return done(err as Error, undefined);
          }
        }
      )
    );
  }

  if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: env.FACEBOOK_APP_ID,
          clientSecret: env.FACEBOOK_APP_SECRET,
          callbackURL: `${env.API_URL}/api/auth/facebook/callback`,
          profileFields: ["id", "emails", "name", "picture.type(large)"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;

            let user = await prisma.user.findUnique({ where: { facebookId: profile.id } });

            if (!user) {
              if (email) {
                user = await prisma.user.findUnique({ where: { email } });
                if (user) {
                  user = await prisma.user.update({
                    where: { id: user.id },
                    data: { facebookId: profile.id },
                  });
                }
              }

              if (!user) {
                const firstName = profile.name?.givenName ?? profile.displayName.split(" ")[0] ?? "";
                const lastName = profile.name?.familyName ?? profile.displayName.split(" ").slice(1).join(" ") ?? "";
                const avatarUrl = (profile.photos?.[0]?.value as string | undefined) ?? null;

                user = await prisma.user.create({
                  data: {
                    email: email ?? `fb_${profile.id}@placeholder.melior`,
                    facebookId: profile.id,
                    firstName,
                    lastName,
                    avatarUrl,
                    role: "CLIENT",
                    needsProfileCompletion: true,
                    clientProfile: { create: {} },
                  },
                });
              }
            }

            return done(null, user);
          } catch (err) {
            return done(err as Error, undefined);
          }
        }
      )
    );
  }
}
