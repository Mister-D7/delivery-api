import type { ComponentType } from 'react';
import {
  Archive as PhArchive,
  ArrowSquareOut as PhArrowSquareOut,
  ArrowsClockwise as PhArrowsClockwise,
  ArrowsIn as PhArrowsIn,
  Bell as PhBell,
  Calendar as PhCalendar,
  CaretDown as PhCaretDown,
  CaretUp as PhCaretUp,
  ChatCircleText as PhChatCircleText,
  Check as PhCheck,
  CheckCircle as PhCheckCircle,
  Checks as PhChecks,
  CircleNotch as PhCircleNotch,
  Clock as PhClock,
  Cloud as PhCloud,
  Copy as PhCopy,
  Cube as PhCube,
  CurrencyDollar as PhCurrencyDollar,
  Database as PhDatabase,
  DotsSixVertical as PhDotsSixVertical,
  Download as PhDownload,
  Envelope as PhEnvelope,
  Eye as PhEye,
  EyeSlash as PhEyeSlash,
  FileArrowDown as PhFileArrowDown,
  FileText as PhFileText,
  FloppyDisk as PhFloppyDisk,
  GearSix as PhGearSix,
  Gift as PhGift,
  GithubLogo as PhGithubLogo,
  Globe as PhGlobe,
  GridFour as PhGridFour,
  HardDrive as PhHardDrive,
  Heart as PhHeart,
  Image as PhImage,
  ImageSquare as PhImageSquare,
  Layout as PhLayout,
  Lightning as PhLightning,
  MagnifyingGlass as PhMagnifyingGlass,
  MapPin as PhMapPin,
  Minus as PhMinus,
  Moon as PhMoon,
  Package as PhPackage,
  PaintBrush as PhPaintBrush,
  Palette as PhPalette,
  PaperPlaneTilt as PhPaperPlaneTilt,
  PencilSimple as PhPencilSimple,
  Phone as PhPhone,
  Play as PhPlay,
  Plus as PhPlus,
  Printer as PhPrinter,
  PushPin as PhPushPin,
  PushPinSlash as PhPushPinSlash,
  Rocket as PhRocket,
  Shield as PhShield,
  ShieldCheck as PhShieldCheck,
  ShoppingBag as PhShoppingBag,
  Sidebar as PhSidebar,
  SidebarSimple as PhSidebarSimple,
  SignOut as PhSignOut,
  SlidersHorizontal as PhSlidersHorizontal,
  Sparkle as PhSparkle,
  SpeakerHigh as PhSpeakerHigh,
  SquaresFour as PhSquaresFour,
  Stack as PhStack,
  Star as PhStar,
  Storefront as PhStorefront,
  Sun as PhSun,
  TextT as PhTextT,
  Ticket as PhTicket,
  ToggleLeft as PhToggleLeft,
  ToggleRight as PhToggleRight,
  Trash as PhTrash,
  TrayArrowUp as PhTrayArrowUp,
  TrendUp as PhTrendUp,
  Truck as PhTruck,
  Upload as PhUpload,
  User as PhUser,
  Users as PhUsers,
  Wallet as PhWallet,
  Warning as PhWarning,
  X as PhX,
  XCircle as PhXCircle,
} from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';

export type AdminIconType = ComponentType<IconProps>;

const duotone = (C: ComponentType<IconProps>): AdminIconType => {
  const Wrapped = (props: IconProps) => (
    <C weight="duotone" data-admin-duotone="" {...props} />
  );
  Wrapped.displayName = `Duotone${C.displayName || C.name || ''}`;
  return Wrapped;
};

export const LayoutDashboard = duotone(PhSquaresFour);
export const Package = duotone(PhPackage);
export const ShieldCheck = duotone(PhShieldCheck);
export const Paintbrush = duotone(PhPaintBrush);
export const Settings = duotone(PhGearSix);
export const DollarSign = duotone(PhCurrencyDollar);
export const Archive = duotone(PhArchive);
export const Ticket = duotone(PhTicket);
export const Users = duotone(PhUsers);
export const HardDrive = duotone(PhHardDrive);
export const Download = duotone(PhDownload);
export const Upload = duotone(PhUpload);
export const Play = duotone(PhPlay);
export const Trash2 = duotone(PhTrash);
export const ToggleLeft = duotone(PhToggleLeft);
export const ToggleRight = duotone(PhToggleRight);
export const Loader2 = duotone(PhCircleNotch);
export const Check = duotone(PhCheck);
export const Eye = duotone(PhEye);
export const Github = duotone(PhGithubLogo);
export const CheckCircle = duotone(PhCheckCircle);
export const XCircle = duotone(PhXCircle);
export const ExternalLink = duotone(PhArrowSquareOut);
export const Cloud = duotone(PhCloud);
export const Database = duotone(PhDatabase);
export const Copy = duotone(PhCopy);
export const ChevronDown = duotone(PhCaretDown);
export const ChevronUp = duotone(PhCaretUp);
export const ArchiveRestore = duotone(PhTrayArrowUp);
export const RefreshCw = duotone(PhArrowsClockwise);
export const Rocket = duotone(PhRocket);
export const Settings2 = duotone(PhSlidersHorizontal);
export const X = duotone(PhX);
export const Plus = duotone(PhPlus);
export const Sparkles = duotone(PhSparkle);
export const Pencil = duotone(PhPencilSimple);
export const Truck = duotone(PhTruck);
export const Clock = duotone(PhClock);
export const TrendingUp = duotone(PhTrendUp);
export const MessageCircle = duotone(PhChatCircleText);
export const Send = duotone(PhPaperPlaneTilt);
export const Search = duotone(PhMagnifyingGlass);
export const Printer = duotone(PhPrinter);
export const AlertTriangle = duotone(PhWarning);
export const Save = duotone(PhFloppyDisk);
export const MapPin = duotone(PhMapPin);
export const LayoutGrid = duotone(PhGridFour);
export const Palette = duotone(PhPalette);
export const Layout = duotone(PhLayout);
export const Image = duotone(PhImage);
export const Type = duotone(PhTextT);
export const Star = duotone(PhStar);
export const ShoppingBag = duotone(PhShoppingBag);
export const Heart = duotone(PhHeart);
export const Zap = duotone(PhLightning);
export const Shield = duotone(PhShield);
export const Gift = duotone(PhGift);
export const Phone = duotone(PhPhone);
export const Mail = duotone(PhEnvelope);
export const Minimize2 = duotone(PhArrowsIn);
export const Layers = duotone(PhStack);
export const Wallet = duotone(PhWallet);
export const Calendar = duotone(PhCalendar);
export const ImagePlus = duotone(PhImageSquare);
export const Box = duotone(PhCube);
export const FileText = duotone(PhFileText);
export const EyeOff = duotone(PhEyeSlash);
export const GripVertical = duotone(PhDotsSixVertical);
export const Bell = duotone(PhBell);
export const Volume2 = duotone(PhSpeakerHigh);
export const Minus = duotone(PhMinus);
export const CheckCheck = duotone(PhChecks);
export const User = duotone(PhUser);
export const LogOut = duotone(PhSignOut);
export const Globe = duotone(PhGlobe);
export const Moon = duotone(PhMoon);
export const Sun = duotone(PhSun);
export const FileDown = duotone(PhFileArrowDown);
export const Pin = duotone(PhPushPin);
export const PinOff = duotone(PhPushPinSlash);
export const Store = duotone(PhStorefront);
export const PanelRightClose = duotone(PhSidebarSimple);
export const PanelRightOpen = duotone(PhSidebar);
