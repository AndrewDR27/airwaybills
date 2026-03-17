# Data Recovery Guide

## ⚠️ Important: New Database = Empty Database

If you created a **new** Upstash Redis database, it starts completely empty. All previous data is lost, including:
- ❌ All user accounts
- ❌ All contacts (shippers, consignees)
- ❌ All airlines
- ❌ All destinations
- ❌ All terminals
- ❌ All shipments
- ❌ All user sessions

---

## 🔍 Check for LocalStorage Backups

Your app may have stored data in browser localStorage. Here's how to check and recover it:

### Step 1: Check if You Have LocalStorage Data

**Option A: Use the Check Users Tool**

1. Visit: `https://your-site.vercel.app/check-users.html`
2. It will show:
   - Database users (empty if new database)
   - LocalStorage users (if any exist)

**Option B: Check Browser Console**

1. Open your site in a browser where you've used it before
2. Open browser console (F12)
3. Run this to check for data:

```javascript
// Check what's in localStorage
console.log('Users:', localStorage.getItem('awb_users'));
console.log('Contacts:', localStorage.getItem('awbContacts'));
console.log('Profile:', localStorage.getItem('awbUserProfile'));
console.log('Shipments:', localStorage.getItem('awbShipments'));
```

If you see data, you can export it!

---

## 💾 Export Data from LocalStorage

If you have data in localStorage, you can export it:

### Export All Data

Run this in your browser console (on your site):

```javascript
// Export function
function exportAllData() {
    const data = {
        users: JSON.parse(localStorage.getItem('awb_users') || '[]'),
        contacts: JSON.parse(localStorage.getItem('awbContacts') || '[]'),
        userProfile: JSON.parse(localStorage.getItem('awbUserProfile') || 'null'),
        shipments: JSON.parse(localStorage.getItem('awbShipments') || '[]'),
        airlines: JSON.parse(localStorage.getItem('awb_airlines') || '[]'),
        destinations: JSON.parse(localStorage.getItem('awb_destinations') || '[]'),
        terminals: JSON.parse(localStorage.getItem('awb_terminals') || '[]'),
    };
    
    // Create download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airwaybills-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    console.log('✅ Data exported!', data);
    return data;
}

// Run it
exportAllData();
```

This will download a JSON file with all your data.

---

## 🔄 Restore Data to New Database

### Option 1: Manual Recreation (Recommended for Small Amounts)

1. **Recreate Users:**
   - Go to admin setup or registration page
   - Create each user account again
   - Use the same emails/passwords if you remember them

2. **Re-add Contacts:**
   - Go to Contacts page
   - Use "Add Shipper" and "Add Consignee" buttons
   - Re-enter contact information

3. **Re-add Airlines/Destinations/Terminals:**
   - Go to respective pages
   - Add them back one by one

### Option 2: Use Export Data (If You Have It)

If you exported data from localStorage:

1. **Open the exported JSON file**
2. **For each data type, you can:**
   - Copy the data
   - Use the app's UI to recreate items
   - Or create a migration script (more advanced)

### Option 3: Check Multiple Browsers/Devices

- Check if you've used the site on:
  - Different browsers (Chrome, Firefox, Safari, Edge)
  - Different devices (desktop, laptop, phone)
  - Different computers
- Each might have localStorage data

---

## 📋 What You'll Need to Recreate

### Critical (Must Have):
1. **Admin User Account**
   - At least one admin account to manage the system
   - Create via admin setup page

2. **Regular User Accounts**
   - All user accounts that were in the system
   - Can be recreated via registration or admin panel

### Important (Should Restore):
3. **Contacts**
   - Shippers
   - Consignees
   - Any linked user relationships

4. **Airlines**
   - All airline information
   - IATA/ICAO codes
   - Contact details

5. **Destinations**
   - Airport codes
   - City/state information

6. **Terminals**
   - Terminal codes and names

### Optional (Can Recreate Later):
7. **Shipments**
   - Historical shipment data
   - Can be recreated as needed

8. **User Profiles**
   - Autofill information
   - Can be re-entered by users

---

## 🚨 Prevention for Future

To prevent data loss in the future:

1. **Regular Backups:**
   - Export data periodically using the export script
   - Save backups to a safe location

2. **Database Monitoring:**
   - Check Upstash console regularly
   - Set up alerts if database is paused
   - Don't delete databases without backing up first

3. **Multiple Environments:**
   - Keep a development database separate from production
   - Test changes on dev first

---

## ✅ Quick Recovery Checklist

- [ ] Checked localStorage in browser console
- [ ] Checked check-users.html page
- [ ] Exported any localStorage data found
- [ ] Created new admin account
- [ ] Recreated user accounts
- [ ] Re-added contacts
- [ ] Re-added airlines/destinations/terminals
- [ ] Verified everything works

---

## 💡 Tips

1. **If you have the old database credentials:**
   - Check if the old database still exists in Upstash
   - You might be able to reconnect to it instead of using the new one
   - Go to Upstash console and check all databases

2. **Check Vercel Logs:**
   - Old data might still be in Vercel function logs
   - Check deployment history for any data dumps

3. **Ask Users:**
   - If you have users, they might have their own data cached
   - They can help recreate their own accounts

---

## 🆘 Still Need Help?

If you're stuck:
1. Check if old database still exists in Upstash console
2. Look for any backup files you might have saved
3. Check if you have the site open in any browser with old data
4. Review Vercel deployment logs for any data exports
