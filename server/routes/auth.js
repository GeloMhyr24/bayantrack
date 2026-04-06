import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import ActivityLog from '../models/ActivityLog.js';
import SystemSetting from '../models/SystemSetting.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { auth } from '../middleware/auth.js';
import { logSystemEvent, sendUserMail } from '../utils/notifications.js';

const router = express.Router();
const ALLOWED_BARANGAY_KEYWORDS = ['mambog ii', 'mambog 2'];
const ALLOWED_CITY_KEYWORDS = ['bacoor'];
const ALLOWED_PROVINCE_KEYWORDS = ['cavite'];
const ALLOWED_SUBDIVISIONS = [
  'villa isabel',
  'camella',
  'soldiers hills',
  'green valley',
  'molino',
  'mambog',
  'springville',
  'st. dominic',
  'niog',
  'talaba',
];

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeLoginIdentifier(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function composeAddress(addressDetails) {
  if (!addressDetails) return '';
  const normalized = {
    ...addressDetails,
    barangay: 'Mambog II',
    city: 'Bacoor',
    province: 'Cavite',
    zipCode: '4102',
  };
  const parts = [
    normalized.street || '',
    normalized.subdivision || '',
    normalized.barangay || '',
    normalized.city || '',
    normalized.province || '',
    normalized.zipCode || '',
  ].filter(Boolean);
  return parts.join(', ');
}

function normalizeAddressDetails(addressDetails) {
  return {
    blk: '',
    lot: '',
    street: String(addressDetails?.street || '').trim(),
    subdivision: String(addressDetails?.subdivision || '').trim(),
    barangay: 'Mambog II',
    city: 'Bacoor',
    province: 'Cavite',
    zipCode: '4102',
  };
}

function getAgeFromBirthDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

function normalizeChildren(children) {
  if (!Array.isArray(children)) return [];
  return children
    .map((child) => ({
      _id: child?._id,
      fullName: String(child?.fullName || '').trim(),
      email: String(child?.email || '').trim().toLowerCase(),
      birthDate: String(child?.birthDate || '').trim(),
      relationship: String(child?.relationship || 'Child').trim() || 'Child',
      status: ['pending', 'approved', 'rejected'].includes(String(child?.status || '').trim()) ? String(child?.status).trim() : 'pending',
      reviewReason: String(child?.reviewReason || '').trim(),
      reviewedAt: child?.reviewedAt || null,
    }))
    .filter((child) => child.fullName && child.birthDate && child.email);
}

function validateChildren(children) {
  const emailSet = new Set();
  for (const child of children) {
    const age = getAgeFromBirthDate(child.birthDate);
    if (age === null) {
      return {
        ok: false,
        msg: `Child record "${child.fullName}" has an invalid birth date.`,
      };
    }
    if (age < 18) {
      return {
        ok: false,
        msg: `Child record "${child.fullName}" must be 18 years old or above.`,
      };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(child.email)) {
      return {
        ok: false,
        msg: `Child record "${child.fullName}" must have a valid email address.`,
      };
    }
    if (emailSet.has(child.email)) {
      return {
        ok: false,
        msg: `Child email "${child.email}" is duplicated in the list.`,
      };
    }
    emailSet.add(child.email);
  }
  return { ok: true };
}

function ensureResidentAddress({ address, addressDetails }) {
  const source = normalizeText(address || composeAddress(addressDetails));
  if (!source) {
    return { ok: false, msg: 'Complete address is required.' };
  }

  const hasBarangay = ALLOWED_BARANGAY_KEYWORDS.some((k) => source.includes(k));
  const hasCity = ALLOWED_CITY_KEYWORDS.some((k) => source.includes(k));
  const hasProvince = ALLOWED_PROVINCE_KEYWORDS.some((k) => source.includes(k));
  const hasKnownSubdivision = ALLOWED_SUBDIVISIONS.some((k) => source.includes(k));

  if (!hasBarangay || !hasCity || !hasProvince) {
    return {
      ok: false,
      msg: 'Registration is exclusive to residents of Mambog II, Bacoor City, Cavite.',
    };
  }

  if (!hasKnownSubdivision) {
    return {
      ok: false,
      msg: 'Please enter a valid Mambog II road/subdivision/compound in your address.',
    };
  }

  return { ok: true };
}

function isStrongPassword(value) {
  const pwd = String(value || '');
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);
}

async function readSystemSettings() {
  const settings = await SystemSetting.findOne();
  return settings || { allowResidentRegistration: true, lockoutWindowMinutes: 15 };
}

function childAccessOtpText({ otp, child, parentName }) {
  return [
    `BayanTrack Child Access OTP`,
    ``,
    `Parent: ${parentName || 'Resident'}`,
    `Requested child full name: ${child.fullName}`,
    `Child email: ${child.email}`,
    `Birth date: ${child.birthDate}`,
    `Relationship: ${child.relationship || 'Child'}`,
    ``,
    `OTP Code: ${otp}`,
    `This code expires in 5 minutes.`,
  ].join('\n');
}

function childProfileUpdateOtpText({ otp, child, parentName }) {
  return [
    `BayanTrack Child Profile Update OTP`,
    ``,
    `Parent: ${parentName || 'Resident'}`,
    `Child full name: ${child.fullName}`,
    `Child email: ${child.email}`,
    ``,
    `OTP Code: ${otp}`,
    `This code expires in 5 minutes.`,
  ].join('\n');
}

// @route   POST api/auth/send-otp
// @desc    Send OTP to email for registration
// @access  Public
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const settings = await readSystemSettings();
    if (!settings.allowResidentRegistration) {
      return res.status(403).json({ msg: 'Resident registration is temporarily disabled by system settings.' });
    }

    // Check if user already exists
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ msg: 'Email is required.' });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB (upsert: update if exists, insert if not)
    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, otp },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Send Email
    await sendUserMail({
      to: normalizedEmail,
      subject: 'Your BayanTrack Registration OTP',
      text: `Your OTP code is: ${otp}. It expires in 5 minutes.`
    });

    res.json({ msg: 'OTP sent to email' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error sending email');
  }
});

// @route   POST api/auth/register/check
// @desc    Validate registration fields before sending OTP
// @access  Public
router.post('/register/check', async (req, res) => {
  const { username, email, contactNumber, address, addressDetails } = req.body;
  try {
    const settings = await readSystemSettings();
    if (!settings.allowResidentRegistration) {
      return res.status(403).json({ msg: 'Resident registration is temporarily disabled by system settings.' });
    }

    if (!username || !email || !contactNumber) {
      return res.status(400).json({ msg: 'Username, email, and phone number are required.' });
    }

    const normalizedAddress = normalizeAddressDetails(addressDetails);
    const residentCheck = ensureResidentAddress({ address, addressDetails: normalizedAddress });
    if (!residentCheck.ok) {
      return res.status(400).json({ msg: residentCheck.msg });
    }

    if (!/^\d{11}$/.test(contactNumber)) {
      return res.status(400).json({ msg: 'Contact number must be exactly 11 digits' });
    }

    const user = await User.findOne({ $or: [{ email }, { username }, { contactNumber }] });
    if (user) {
      if (user.email === email) return res.status(400).json({ msg: 'Email is already registered.' });
      if (user.username === username) return res.status(400).json({ msg: 'Username is already taken.' });
      if (user.contactNumber === contactNumber) return res.status(400).json({ msg: 'Phone number is already registered.' });
      return res.status(400).json({ msg: 'Account details already in use.' });
    }

    return res.json({ msg: 'Registration details are available.' });
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to validate registration details.' });
  }
});

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const {
    username,
    firstName,
    middleName,
    lastName,
    address,
    addressDetails,
    contactNumber,
    email,
    password,
    otp,
    validIdType,
    validIdImage,
    gender,
    civilStatus,
    marriageContractImage,
    residentNote,
    children,
  } = req.body;

  try {
    const settings = await readSystemSettings();
    if (!settings.allowResidentRegistration) {
      return res.status(403).json({ msg: 'Resident registration is temporarily disabled by system settings.' });
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedAddress = normalizeAddressDetails(addressDetails);

    // Verify OTP
    const validOtp = await Otp.findOne({ email: normalizedEmail, otp: String(otp || '').trim() });
    if (!validOtp) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Validate Contact Number (Must be 11 digits)
    if (!/^\d{11}$/.test(contactNumber)) {
      return res.status(400).json({ msg: 'Contact number must be exactly 11 digits' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ msg: 'Password must be at least 8 characters and include uppercase, lowercase, and 1 special character.' });
    }

    let user = await User.findOne({ $or: [{ email: normalizedEmail }, { username }, { contactNumber }] });
    if (user) {
      if (user.email === email) {
        return res.status(400).json({ msg: 'Email is already registered.' });
      }
      if (user.username === username) {
        return res.status(400).json({ msg: 'Username is already taken.' });
      }
      if (user.contactNumber === contactNumber) {
        return res.status(400).json({ msg: 'Phone number is already registered.' });
      }
      return res.status(400).json({ msg: 'Account details already in use.' });
    }

    if (!validIdType || !validIdImage) {
      return res.status(400).json({ msg: 'Valid ID type and image are required' });
    }

    const residentCheck = ensureResidentAddress({ address, addressDetails: normalizedAddress });
    if (!residentCheck.ok) {
      return res.status(400).json({ msg: residentCheck.msg });
    }

    const childRows = normalizeChildren(children);
    const childCheck = validateChildren(childRows);
    if (!childCheck.ok) {
      return res.status(400).json({ msg: childCheck.msg });
    }

    const mergedAddress = address || composeAddress(normalizedAddress);

    user = new User({
      username,
      firstName,
      middleName,
      lastName,
      address: mergedAddress,
      addressDetails: normalizedAddress,
      contactNumber,
      email: normalizedEmail,
      password,
      gender,
      civilStatus: 'single',
      marriageContractImage: '',
      residentNote: residentNote || '',
      children: childRows,
      validIdType,
      validIdImage,
      status: 'pending',
      validIdStatus: 'pending',
    });

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    
    // Delete used OTP
    await Otp.deleteOne({ _id: validOtp._id });

    await logSystemEvent({
      user: user._id,
      type: 'resident-registration',
      title: `New resident registration submitted by ${username}`,
      referenceNo: user._id.toString(),
      metadata: { module: 'auth', action: 'register', status: 'pending', residentEmail: normalizedEmail },
    });

    res.send('Registration submitted. Awaiting superadmin approval.');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier can be username, email or phone

  try {
    const settings = await readSystemSettings();
    const lockoutMinutes = Number(settings.lockoutWindowMinutes) > 0 ? Number(settings.lockoutWindowMinutes) : 15;
    const normalizedIdentifier = normalizeLoginIdentifier(identifier);

    // Check for user by Username OR Email OR Contact Number
    let user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { contactNumber: identifier }, { username: identifier }]
    });
    let actingChild = null;

    if (!user) {
      const childMatchedUser = await User.findOne({
        children: {
          $elemMatch: {
            status: 'approved',
            $or: [
              { email: normalizedIdentifier },
              { fullName: new RegExp(`^${String(identifier || '').trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, 'i') },
            ],
          },
        },
      });
      if (childMatchedUser) {
        user = childMatchedUser;
        actingChild = (childMatchedUser.children || []).find((child) =>
          String(child.status || '') === 'approved' &&
          (
            normalizeLoginIdentifier(child.email) === normalizedIdentifier ||
            normalizeLoginIdentifier(child.fullName) === normalizedIdentifier
          )
        ) || null;
      }
    }

    if (!user) {
      return res.status(404).json({ msg: 'Account is not registered yet or may have been deleted.' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({
        msg: 'Too many failed login attempts. Please use Forgot Password (OTP) or try again later.',
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const lockNow = attempts >= 3;
      user.failedLoginAttempts = lockNow ? 0 : attempts;
      user.lockUntil = lockNow ? new Date(Date.now() + lockoutMinutes * 60 * 1000) : null;
      await user.save();
      if (lockNow) {
        return res.status(423).json({
          msg: `Too many failed login attempts. Please use Forgot Password (OTP) or try again in ${lockoutMinutes} minutes.`,
        });
      }
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // superadmin account must always be login-capable even if status is not active
    if (user.role !== 'superadmin' && user.status !== 'active') {
      if (user.status === 'suspended') {
        return res.status(403).json({ msg: 'This account was archived by superadmin. Contact support or use Forgot Password.' });
      }
      return res.status(403).json({ msg: 'Account is pending approval by superadmin.' });
    }

    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // Return Token (JWT)
    const payload = {
      user: {
        id: user.id,
        ...(actingChild ? {
          actingChild: {
            id: actingChild._id?.toString?.() || '',
            fullName: actingChild.fullName || '',
            email: actingChild.email || '',
          },
        } : {}),
      },
    };
    jwt.sign(payload, process.env.JWT_SECRET || 'secrettoken', { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token, role: user.role, actingChild });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const payload = user.toObject();
    if (req.user.actingChild?.id) {
      const freshChild = (user.children || []).find((child) => String(child._id) === String(req.user.actingChild.id));
      payload.actingChild = freshChild
        ? {
            id: freshChild._id?.toString?.() || '',
            fullName: freshChild.fullName || '',
            email: freshChild.email || '',
          }
        : req.user.actingChild || null;
    } else {
      payload.actingChild = req.user.actingChild || null;
    }
    res.json(payload);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auth/user
// @desc    Update user data
// @access  Private
router.put('/user', auth, async (req, res) => {
  const {
    username,
    firstName,
    middleName,
    lastName,
    address,
    addressDetails,
    contactNumber,
    email,
    avatarImage,
    password,
    preferredContactMethod,
    emailOtp,
    passwordOtp,
    gender,
    civilStatus,
    marriageContractImage,
    residentNote,
    children,
  } = req.body;
  
  // Build user object
  const userFields = {};
  if (username) userFields.username = username;
  if (firstName) userFields.firstName = firstName;
  if (middleName) userFields.middleName = middleName;
  if (lastName) userFields.lastName = lastName;
  if (address) userFields.address = address;
  if (addressDetails) {
    userFields.addressDetails = normalizeAddressDetails(addressDetails);
    userFields.address = composeAddress(userFields.addressDetails);
  }
  if (contactNumber) userFields.contactNumber = contactNumber;
  if (email) userFields.email = email;
  if (avatarImage !== undefined) userFields.avatarImage = avatarImage;
  if (preferredContactMethod) userFields.preferredContactMethod = 'Email';
  if (gender) userFields.gender = gender;
  userFields.civilStatus = 'single';
  userFields.marriageContractImage = '';
  if (residentNote !== undefined) userFields.residentNote = residentNote;
  if (children !== undefined) userFields.children = normalizeChildren(children);

  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const isEmailChange = Boolean(email && email !== user.email);

    if (isEmailChange) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (emailExists) return res.status(400).json({ msg: 'Email is already registered.' });
      if (!emailOtp) return res.status(400).json({ msg: 'OTP is required to change email.' });
      const validOtp = await Otp.findOne({ email, otp: emailOtp });
      if (!validOtp) return res.status(400).json({ msg: 'Invalid or expired email OTP.' });
    }

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (usernameExists) return res.status(400).json({ msg: 'Username is already taken.' });
    }

    if (contactNumber && contactNumber !== user.contactNumber) {
      if (!/^\d{11}$/.test(contactNumber)) {
        return res.status(400).json({ msg: 'Contact number must be exactly 11 digits' });
      }
      const phoneExists = await User.findOne({ contactNumber, _id: { $ne: req.user.id } });
      if (phoneExists) return res.status(400).json({ msg: 'Phone number is already registered.' });
    }

    if (address || addressDetails) {
      const residentCheck = ensureResidentAddress({
        address: userFields.address || address,
        addressDetails: userFields.addressDetails || normalizeAddressDetails(addressDetails),
      });
      if (!residentCheck.ok) {
        return res.status(400).json({ msg: residentCheck.msg });
      }
    }

    if (children !== undefined) {
      const childCheck = validateChildren(userFields.children || []);
      if (!childCheck.ok) {
        return res.status(400).json({ msg: childCheck.msg });
      }
    }

    if (password) {
      if (!isStrongPassword(password)) {
        return res.status(400).json({ msg: 'Password must be at least 8 characters and include uppercase, lowercase, and 1 special character.' });
      }
      if (!passwordOtp) return res.status(400).json({ msg: 'OTP is required to change password.' });
      const validPasswordOtp = await Otp.findOne({ email: user.email, otp: passwordOtp });
      if (!validPasswordOtp) return res.status(400).json({ msg: 'Invalid or expired password OTP.' });
      const salt = await bcrypt.genSalt(10);
      userFields.password = await bcrypt.hash(password, salt);
      await Otp.deleteMany({ email: user.email });
    }

    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { returnDocument: 'after' }
    ).select('-password');

    await logSystemEvent({
      user: req.user.id,
      type: 'profile-update',
      title: 'Updated profile settings',
      metadata: { module: 'profile', action: 'update' },
      notifySuperadmin: true,
    });

    if (isEmailChange) {
      await Otp.deleteMany({ email });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/notifications
// @desc    Resident notification feed (latest status updates)
// @access  Private
router.get('/notifications', auth, async (req, res) => {
  try {
    return res.json({ count: 0, items: [] });
  } catch (_err) {
    return res.status(500).json({ msg: 'Failed to fetch notifications' });
  }
});

// @route   POST api/auth/change-email/request-otp
// @desc    Send OTP to new email before changing resident email
// @access  Private
router.post('/change-email/request-otp', auth, async (req, res) => {
  const { newEmail } = req.body;

  try {
    if (!newEmail) return res.status(400).json({ msg: 'New email is required.' });

    const currentUser = await User.findById(req.user.id).select('email');
    if (!currentUser) return res.status(404).json({ msg: 'User not found' });

    if (String(newEmail).toLowerCase() === String(currentUser.email || '').toLowerCase()) {
      return res.status(400).json({ msg: 'New email must be different from current email.' });
    }

    const existing = await User.findOne({ email: newEmail, _id: { $ne: req.user.id } });
    if (existing) return res.status(400).json({ msg: 'Email is already registered.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate(
      { email: newEmail },
      { email: newEmail, otp },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    await sendUserMail({
      to: newEmail,
      subject: 'Confirm Email Change (BayanTrack OTP)',
      text: `Your OTP code is: ${otp}. It expires in 5 minutes.`,
    });

    return res.json({ msg: 'OTP sent to new email.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Failed to send OTP.' });
  }
});

// @route   POST api/auth/change-password/request-otp
// @desc    Send OTP to currently registered email before password change
// @access  Private
router.post('/change-password/request-otp', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (!user.email) return res.status(400).json({ msg: 'No registered email found for this account.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate(
      { email: user.email },
      { email: user.email, otp },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    await sendUserMail({
      to: user.email,
      subject: 'Confirm Password Change (BayanTrack OTP)',
      text: `Your password-change OTP code is: ${otp}. It expires in 5 minutes.`
    });

    return res.json({ msg: 'OTP sent to your registered email.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Failed to send OTP.' });
  }
});

// @route   POST api/auth/child-access/request-otp
// @desc    Send OTP to parent email before saving child access request
// @access  Private
router.post('/child-access/request-otp', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found.' });

    const childRows = normalizeChildren([req.body.child]);
    if (childRows.length === 0) {
      return res.status(400).json({ msg: 'Complete child information is required.' });
    }
    const child = childRows[0];
    const childCheck = validateChildren([child]);
    if (!childCheck.ok) {
      return res.status(400).json({ msg: childCheck.msg });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate(
      { email: user.email },
      { email: user.email, otp },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    await sendUserMail({
      to: user.email,
      subject: 'Confirm Child Access Request (BayanTrack OTP)',
      text: childAccessOtpText({
        otp,
        child,
        parentName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      }),
    });

    return res.json({ msg: 'OTP sent to your registered email.' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Failed to send child access OTP.' });
  }
});

// @route   POST api/auth/child-access/verify
// @desc    Verify OTP and save child access request to resident record
// @access  Private
router.post('/child-access/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found.' });

    const childRows = normalizeChildren([req.body.child]);
    if (childRows.length === 0) {
      return res.status(400).json({ msg: 'Complete child information is required.' });
    }
    const child = childRows[0];
    const childCheck = validateChildren([child]);
    if (!childCheck.ok) {
      return res.status(400).json({ msg: childCheck.msg });
    }

    const otp = String(req.body.otp || '').trim();
    if (!otp) return res.status(400).json({ msg: 'OTP is required.' });

    const validOtp = await Otp.findOne({ email: user.email, otp });
    if (!validOtp) {
      return res.status(400).json({ msg: 'Invalid or expired OTP.' });
    }

    const existingChildren = Array.isArray(user.children) ? user.children.map((item) => ({
      _id: item._id,
      fullName: String(item.fullName || '').trim(),
      email: String(item.email || '').trim().toLowerCase(),
      birthDate: String(item.birthDate || '').trim(),
      relationship: String(item.relationship || 'Child').trim() || 'Child',
      status: String(item.status || 'pending').trim() || 'pending',
      reviewReason: String(item.reviewReason || '').trim(),
      reviewedAt: item.reviewedAt || null,
    })) : [];

    const nextChildren = [
      ...existingChildren.filter((item) => item.email !== child.email),
      { ...child, status: 'pending', reviewReason: '', reviewedAt: null },
    ];

    user.children = nextChildren;
    await user.save();
    await Otp.deleteOne({ _id: validOtp._id });

    await logSystemEvent({
      user: req.user.id,
      title: `Submitted child access request for ${child.fullName}`,
      type: 'child-access',
      metadata: { module: 'child-access', action: 'submit', childEmail: child.email, status: 'pending' },
    });

    return res.json({ msg: 'Child access request submitted and is now pending superadmin approval.', children: user.children });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Failed to verify child access request.' });
  }
});

// @route   POST api/auth/child-session/request-otp
// @desc    Send OTP to parent email before child session profile update
// @access  Private
router.post('/child-session/request-otp', auth, async (req, res) => {
  try {
    if (!req.user.actingChild?.id) {
      return res.status(403).json({ msg: 'Only child-session users can request this update.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found.' });

    const child = user.children.id(req.user.actingChild.id);
    if (!child || child.status !== 'approved') {
      return res.status(404).json({ msg: 'Approved child session not found.' });
    }

    const nextFullName = String(req.body.fullName || '').trim();
    const nextEmail = String(req.body.email || '').trim().toLowerCase();
    if (!nextFullName || !nextEmail) {
      return res.status(400).json({ msg: 'Child name and email are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      return res.status(400).json({ msg: 'Enter a valid child email address.' });
    }

    const existingUser = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
    if (existingUser) {
      return res.status(400).json({ msg: 'That email is already used by another account.' });
    }
    const duplicateChild = (user.children || []).find((item) => String(item._id) !== String(child._id) && String(item.email || '').toLowerCase() === nextEmail);
    if (duplicateChild) {
      return res.status(400).json({ msg: 'That email is already used by another linked child.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate(
      { email: user.email },
      { email: user.email, otp },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    await sendUserMail({
      to: user.email,
      subject: 'Confirm Child Profile Update (BayanTrack OTP)',
      text: childProfileUpdateOtpText({
        otp,
        child: { fullName: nextFullName, email: nextEmail },
        parentName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      }),
    });

    return res.json({ msg: 'OTP sent to parent email.' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Failed to send child profile OTP.' });
  }
});

// @route   PUT api/auth/child-session/update
// @desc    Update the approved child session profile after parent OTP verification
// @access  Private
router.put('/child-session/update', auth, async (req, res) => {
  try {
    if (!req.user.actingChild?.id) {
      return res.status(403).json({ msg: 'Only child-session users can update this profile.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found.' });

    const child = user.children.id(req.user.actingChild.id);
    if (!child || child.status !== 'approved') {
      return res.status(404).json({ msg: 'Approved child session not found.' });
    }

    const nextFullName = String(req.body.fullName || '').trim();
    const nextEmail = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();

    if (!nextFullName || !nextEmail) {
      return res.status(400).json({ msg: 'Child name and email are required.' });
    }
    if (!otp) {
      return res.status(400).json({ msg: 'OTP is required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      return res.status(400).json({ msg: 'Enter a valid child email address.' });
    }

    const validOtp = await Otp.findOne({ email: user.email, otp });
    if (!validOtp) {
      return res.status(400).json({ msg: 'Invalid or expired OTP.' });
    }

    const existingUser = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
    if (existingUser) {
      return res.status(400).json({ msg: 'That email is already used by another account.' });
    }
    const duplicateChild = (user.children || []).find((item) => String(item._id) !== String(child._id) && String(item.email || '').toLowerCase() === nextEmail);
    if (duplicateChild) {
      return res.status(400).json({ msg: 'That email is already used by another linked child.' });
    }

    child.fullName = nextFullName;
    child.email = nextEmail;
    await user.save();
    await Otp.deleteOne({ _id: validOtp._id });

    await logSystemEvent({
      user: req.user.id,
      type: 'child-profile-update',
      title: `Updated child session profile for ${nextFullName}`,
      referenceNo: child._id?.toString?.() || '',
      metadata: { module: 'child-access', action: 'update-profile', childEmail: nextEmail },
    });

    return res.json({
      msg: 'Child profile updated successfully.',
      actingChild: {
        id: child._id?.toString?.() || '',
        fullName: child.fullName || '',
        email: child.email || '',
      },
      children: user.children || [],
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Failed to update child session profile.' });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "No account found with this email." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB
    await Otp.findOneAndUpdate(
      { email },
      { email, otp },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Send Email
    await sendUserMail({
      to: email,
      subject: 'Password Reset Request',
      text: `Your password reset code is: ${otp}. It expires in 5 minutes.`
    });

    res.json({ msg: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to send email." });
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // Verify OTP
    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ msg: 'Password must be at least 8 characters and include uppercase, lowercase, and 1 special character.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Delete used OTP
    await Otp.deleteOne({ _id: validOtp._id });

    await logSystemEvent({
      user: user._id,
      type: 'password-reset',
      title: `Password reset completed for ${user.username}`,
      referenceNo: user._id.toString(),
      metadata: { module: 'auth', action: 'reset-password' },
    });

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
