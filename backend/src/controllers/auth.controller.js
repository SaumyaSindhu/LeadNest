import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
}

export async function register(req, res) {
  let tenant;

  try {
    const { name, email, password, companyName } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      typeof password !== "string" ||
      !companyName?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and company name are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    tenant = await Tenant.create({
      name: companyName.trim(),
    });

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      tenantId: tenant._id,
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    // Remove the newly created tenant if registration failed
    // before the user account was created.
    if (tenant) {
      const userExists = await User.exists({ tenantId: tenant._id });

      if (!userExists) {
        await Tenant.findByIdAndDelete(tenant._id);
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register user",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
}
