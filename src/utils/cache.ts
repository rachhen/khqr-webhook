export const setKhqrToken = (
  env: CloudflareBindings,
  opts: { token: string; expiredAt: Date }
) => {
  return env.KHQR_WEBHOOK.put("token", opts.token, {
    expirationTtl: opts.expiredAt.getTime() / 1000,
  });
};

export const getKhqrToken = (env: CloudflareBindings) => {
  return env.KHQR_WEBHOOK.get("token");
};
