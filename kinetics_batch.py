# kinetics_batch.py (corrected to explicitly return a tuple)

def _rates(X, S, P, params, D=0.0, Sin=0.0):
    """
    Calculates the rates of change for biomass (X), substrate (S), and product (P).
    """
    mu_max = params["mu_max"]
    Ks = params["Ks"]
    Yxs = params["Yxs"]
    mS = params.get("mS", 0.0)
    kd = params.get("kd", 0.0)
    alpha = params.get("alpha", 0.0)
    beta = params.get("beta", 0.0)

    if S < 0: S = 0.0
    
    mu = mu_max * S / (Ks + S) if (Ks + S) > 1e-9 else 0.0
    qS = (mu / Yxs) + mS if Yxs > 1e-9 else 0.0
    qP = alpha * mu + beta

    dX = (mu - kd - D) * X
    dS = D * (Sin - S) - qS * X
    dP = qP * X - D * P

    return dX, dS, dP, mu, qS, qP

def simulate_batch(t_final=10.0, dt=0.1,
                   X0=0.1, S0=10.0, P0=0.0,
                   mu_max=0.5, Ks=0.5, Yxs=0.5,
                   mS=0.0, kd=0.0, alpha=0.0, beta=0.0,
                   method='rk4'):
    """
    Simulate batch reactor.
    """
    if dt <= 0:
        raise ValueError("dt (time step) must be > 0")
    n_steps = int(max(1, round(t_final / dt)))
    times = [0.0] * (n_steps + 1)
    X = [0.0] * (n_steps + 1)
    S = [0.0] * (n_steps + 1)
    P = [0.0] * (n_steps + 1)
    mu_list = [0.0] * (n_steps + 1)

    X[0], S[0], P[0] = float(X0), float(S0), float(P0)

    params = {"mu_max": float(mu_max), "Ks": float(Ks), "Yxs": float(Yxs),
              "mS": float(mS), "kd": float(kd), "alpha": float(alpha), "beta": float(beta)}
    
    _, _, _, mu_list[0], _, _ = _rates(X[0], S[0], P[0], params, D=0.0)

    for i in range(n_steps):
        times[i+1] = (i + 1) * dt
        Xn, Sn, Pn = X[i], S[i], P[i]

        if method == 'euler':
            dX, dS, dP, mu, _, _ = _rates(Xn, Sn, Pn, params, D=0.0)
            X[i+1] = max(Xn + dX * dt, 0.0)
            S[i+1] = max(Sn + dS * dt, 0.0)
            P[i+1] = max(Pn + dP * dt, 0.0)
            mu_list[i+1] = mu
        else: # RK4
            k1_dx, k1_ds, k1_dp, mu1, _, _ = _rates(Xn, Sn, Pn, params, D=0.0)
            k2_dx, k2_ds, k2_dp, _, _, _ = _rates(Xn + 0.5*dt*k1_dx, Sn + 0.5*dt*k1_ds, Pn + 0.5*dt*k1_dp, params, D=0.0)
            k3_dx, k3_ds, k3_dp, _, _, _ = _rates(Xn + 0.5*dt*k2_dx, Sn + 0.5*dt*k2_ds, Pn + 0.5*dt*k2_dp, params, D=0.0)
            k4_dx, k4_ds, k4_dp, _, _, _ = _rates(Xn + dt*k3_dx, Sn + dt*k3_ds, Pn + dt*k3_dp, params, D=0.0)

            X[i+1] = max(Xn + (dt/6.0) * (k1_dx + 2*k2_dx + 2*k3_dx + k4_dx), 0.0)
            S[i+1] = max(Sn + (dt/6.0) * (k1_ds + 2*k2_ds + 2*k3_ds + k4_ds), 0.0)
            P[i+1] = max(Pn + (dt/6.0) * (k1_dp + 2*k2_dp + 2*k3_dp + k4_dp), 0.0)
            mu_list[i+1] = mu1

    return (times, X, S, P, mu_list)


def cstr_steady_state(Sin, D, mu_max=0.5, Ks=0.5, Yxs=0.5, mS=0.0, kd=0.0, alpha=0.0, beta=0.0):
    """
    Compute steady-state for a CSTR.
    """
    if D <= 0:
        raise ValueError("D (dilution rate) must be > 0 for steady-state calculation.")
    mu_eq = D + kd
    if mu_eq >= mu_max:
        return (Sin, 0.0, 0.0)
    
    S_star = Ks * mu_eq / (mu_max - mu_eq)
    
    if S_star > Sin:
        return (Sin, 0.0, 0.0)

    mu = mu_eq
    qS = (mu / Yxs) + mS if Yxs > 1e-9 else 0.0
    if qS <= 1e-9:
        return (S_star, 0.0, 0.0)
        
    qP = alpha * mu + beta
    
    X_star = D * (Sin - S_star) / qS
    P_star = qP * X_star / D if D > 1e-9 else 0.0

    return (max(S_star, 0.0), max(X_star, 0.0), max(P_star, 0.0))


def simulate_cstr(t_final=10.0, dt=0.1,
                  X0=0.1, S0=10.0, P0=0.0, Sin=10.0, D=0.1,
                  mu_max=0.5, Ks=0.5, Yxs=0.5,
                  mS=0.0, kd=0.0, alpha=0.0, beta=0.0,
                  method='rk4'):
    """
    Simulate dynamic CSTR.
    """
    if dt <= 0:
        raise ValueError("dt (time step) must be > 0")
    if D <= 0:
        raise ValueError("D (dilution rate) must be > 0 for CSTR simulation.")

    n_steps = int(max(1, round(t_final / dt)))
    times = [0.0] * (n_steps + 1)
    X = [0.0] * (n_steps + 1)
    S = [0.0] * (n_steps + 1)
    P = [0.0] * (n_steps + 1)
    mu_list = [0.0] * (n_steps + 1)

    X[0], S[0], P[0] = float(X0), float(S0), float(P0)

    params = {"mu_max": float(mu_max), "Ks": float(Ks), "Yxs": float(Yxs),
              "mS": float(mS), "kd": float(kd), "alpha": float(alpha), "beta": float(beta)}

    _, _, _, mu_list[0], _, _ = _rates(X[0], S[0], P[0], params, D=float(D), Sin=float(Sin))

    for i in range(n_steps):
        times[i+1] = (i + 1) * dt
        Xn, Sn, Pn = X[i], S[i], P[i]

        if method == 'euler':
            dX, dS, dP, mu, _, _ = _rates(Xn, Sn, Pn, params, D=float(D), Sin=float(Sin))
            X[i+1] = max(Xn + dX * dt, 0.0)
            S[i+1] = max(Sn + dS * dt, 0.0)
            P[i+1] = max(Pn + dP * dt, 0.0)
            mu_list[i+1] = mu
        else: # RK4
            k1_dx, k1_ds, k1_dp, mu1, _, _ = _rates(Xn, Sn, Pn, params, D=float(D), Sin=float(Sin))
            k2_dx, k2_ds, k2_dp, _, _, _ = _rates(Xn + 0.5*dt*k1_dx, Sn + 0.5*dt*k1_ds, Pn + 0.5*dt*k1_dp, params, D=float(D), Sin=float(Sin))
            k3_dx, k3_ds, k3_dp, _, _, _ = _rates(Xn + 0.5*dt*k2_dx, Sn + 0.5*dt*k2_ds, Pn + 0.5*dt*k2_dp, params, D=float(D), Sin=float(Sin))
            k4_dx, k4_ds, k4_dp, _, _, _ = _rates(Xn + dt*k3_dx, Sn + dt*k3_ds, Pn + dt*k3_dp, params, D=float(D), Sin=float(Sin))

            X[i+1] = max(Xn + (dt/6.0) * (k1_dx + 2*k2_dx + 2*k3_dx + k4_dx), 0.0)
            S[i+1] = max(Sn + (dt/6.0) * (k1_ds + 2*k2_ds + 2*k3_ds + k4_ds), 0.0)
            P[i+1] = max(Pn + (dt/6.0) * (k1_dp + 2*k2_dp + 2*k3_dp + k4_dp), 0.0)
            mu_list[i+1] = mu1

    return (times, X, S, P, mu_list)

