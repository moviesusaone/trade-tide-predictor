
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';

const NavigationBar = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-lg shadow-sm mb-6"
    >
      <NavigationMenu className="w-full max-w-full justify-start">
        <NavigationMenuList className="flex space-x-2 p-2">
          <NavigationMenuItem>
            <Link to="/" className={navigationMenuTriggerStyle()}>
              الرئيسية
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/notifications" className={navigationMenuTriggerStyle() + " bg-accent/50"}>
              الإشعارات
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </motion.div>
  );
};

export default NavigationBar;
