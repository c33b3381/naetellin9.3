# WEAPON-BASED COMBAT SYSTEM UPGRADE - AUDIT & IMPLEMENTATION PLAN

## PART 1: CURRENT SYSTEM AUDIT

### **Attack Timing Control**
**Location**: `frontend/src/pages/GameWorld.jsx`
- **Line 360**: `autoAttackSpeedRef = useRef(2.0)` - Default 2.0 seconds between attacks
- **Line 1412**: Swing timer check: `timeSinceLastAttack < autoAttackSpeedRef.current * 1000`
- **Constant**: `COMBAT_CONSTANTS.PLAYER_AUTO_ATTACK_SPEED = 2.0` (from CombatSystem.js line 22)

### **Base Damage Calculation**
**Location**: `frontend/src/systems/CombatSystem.js`
- **Line 171-174**: `calculateAutoAttackDamage()`
- **Formula**: Random between `AUTO_ATTACK_DAMAGE_MIN` and `AUTO_ATTACK_DAMAGE_MAX`
- **No weapon bonuses currently applied**

### **Alternating Hand Logic**
**Location**: `frontend/src/pages/GameWorld.jsx`
- **Line 365**: `attackHandRef = useRef('left')` - Currently starts with left (where sword is)
- **Line 1420**: Gets current hand: `const currentHand = attackHandRef.current`
- **Line 1421**: Triggers animation: `playAttackAnimation(currentHand)`
- **Line 1424**: Alternates: `attackHandRef.current = currentHand === 'left' ? 'right' : 'left'`

### **Animation Trigger**
**Location**: `frontend/src/pages/GameWorld.jsx`
- **Line 1302-1373**: `playAttackAnimation(hand)` function
- **Accesses arm pivot**: `playerModelRef.current.userData?.[armPivotName]`
- **Three phases**: wind-up (150ms) → swing (100ms) → return (200ms)

### **Current Weapon Attachment**
**Location**: `frontend/src/pages/GameWorld.jsx`
- **Line 779**: Currently attached to **LEFT arm**: `leftArmPivot`
- **For weapon combat, needs to be on RIGHT arm**

---

## PART 2: IMPLEMENTATION PLAN

### **Step 1: Move Sword to Right Arm**
- Change attachment from `leftArmPivot` to `rightArmPivot`
- This aligns with standard MMO convention (weapon in main hand = right)

### **Step 2: Stop Hand Alternating When Weapon Equipped**
- Add check: if mainHand has weapon → only use 'right' arm
- Remove hand alternation line (1424) when weapon equipped
- Keep alternation for unarmed combat

### **Step 3: Add Weapon Stats to Items**
All swords need:
```javascript
stats: {
  damage: number,      // Bonus damage per hit
  attackSpeed: number  // Attack interval in seconds
}
```

### **Step 4: Create Helper Functions**
```javascript
getEquippedMainHandWeapon(equipment)
getWeaponAttackSpeed(weapon, baseSpeed)
getWeaponDamageBonus(weapon)
isWeaponEquipped(equipment)
```

### **Step 5: Apply Weapon Speed to Attack Timing**
- Read weapon.stats.attackSpeed
- Update autoAttackSpeedRef.current when equipment changes
- Use weapon speed instead of default 2.0 seconds

### **Step 6: Apply Weapon Damage to Hits**
- Modify calculateAutoAttackDamage() to accept weapon parameter
- Add weapon.stats.damage to base damage calculation
- Keep random variance for MMO feel

---

## INTEGRATION POINTS

### **Clean Integration Point #1: Equipment Change**
**Location**: Weapon attachment useEffect (line ~762)
- Already watches equipment changes
- Perfect place to update attack speed ref
- Can set weapon-based combat flag

### **Clean Integration Point #2: Attack Execution**
**Location**: `performAutoAttack` function (line 1388)
- Check if weapon equipped
- Use weapon hand only (no alternating)
- Pass weapon to damage calculation

### **Clean Integration Point #3: Damage Calculation**
**Location**: `calculateAutoAttackDamage` in CombatSystem.js
- Add optional weapon parameter
- Add weapon damage bonus if present
- Keep existing random variance

---

## WEAPON STATS STRUCTURE

### **Item Data Format** (items.js):
```javascript
iron_sword: {
  id: 'iron_sword',
  name: 'Iron Sword',
  equipSlot: 'mainHand',
  type: 'equipment',
  weaponModel: 'sword_iron',
  stats: {
    damage: 8,        // +8 damage per hit
    attackSpeed: 1.9  // 1.9 seconds between attacks
  }
}
```

---

## FALLBACK BEHAVIOR

**Unarmed (No Weapon)**:
- Use default attack speed (2.0 seconds)
- Use base damage (random 2-6)
- Alternate hands (left → right → left)
- Current bare-hand combat feel

**Weapon Equipped**:
- Use weapon attack speed (e.g., 1.9 seconds for iron sword)
- Use base damage + weapon bonus
- Right arm only
- Proper weapon combat feel

---

## EXTENSIBILITY PATTERN

### **Helper Functions** (to be added to GameWorld.jsx):
```javascript
// Get equipped weapon from mainHand slot
const getEquippedMainHandWeapon = (equipment) => {
  return equipment?.mainHand || null;
};

// Get weapon attack speed or default
const getWeaponAttackSpeed = (weapon) => {
  return weapon?.stats?.attackSpeed || COMBAT_CONSTANTS.PLAYER_AUTO_ATTACK_SPEED;
};

// Get weapon damage bonus
const getWeaponDamageBonus = (weapon) => {
  return weapon?.stats?.damage || 0;
};

// Check if weapon equipped
const isWeaponEquipped = (equipment) => {
  return equipment?.mainHand?.type === 'equipment';
};
```

### **Future Weapon Types**:
- Two-handed swords: Use both arms for attack animation
- Daggers: Faster attack speed, dual-wield support
- Axes: Slower, higher damage
- Bows/Ranged: Different attack pattern entirely

---

## FILES TO MODIFY

1. **`frontend/src/data/items.js`**
   - Add `stats: { damage, attackSpeed }` to all sword items

2. **`frontend/src/pages/GameWorld.jsx`**
   - Move weapon attachment to right arm
   - Add weapon helper functions
   - Update performAutoAttack to use weapon stats
   - Stop hand alternation when weapon equipped
   - Update attack speed on equipment change

3. **`frontend/src/systems/CombatSystem.js`**
   - Update calculateAutoAttackDamage to accept weapon parameter
   - Add weapon damage bonus to calculation

---

## TESTING CHECKLIST

**Setup**:
- [ ] Equip iron sword in mainHand

**Right Arm Only**:
- [ ] Attack enemy
- [ ] Only right arm swings (not left)
- [ ] Left arm stays idle during combat
- [ ] Sword attached to right arm and swings with it

**Weapon Speed**:
- [ ] Attacks occur at weapon speed (1.9s for iron sword)
- [ ] Not default 2.0s
- [ ] Consistent timing

**Weapon Damage**:
- [ ] Damage numbers include weapon bonus (+8 for iron sword)
- [ ] Higher than unarmed damage
- [ ] Still has random variance

**Unarmed Fallback**:
- [ ] Unequip sword
- [ ] Hands alternate (left → right → left)
- [ ] Default 2.0s attack speed
- [ ] Base damage without bonus

**No Regressions**:
- [ ] No console errors
- [ ] Sword visible on character
- [ ] Character panel works
- [ ] Equipment drag-and-drop works

---

## IMPLEMENTATION ORDER

1. ✅ Audit complete (this document)
2. Add weapon stats to sword items
3. Move weapon attachment to right arm
4. Add helper functions
5. Update performAutoAttack for weapon-only-right-arm
6. Apply weapon speed to attack timing
7. Apply weapon damage to hit calculation
8. Test all scenarios
9. Document changes

**Estimated Lines of Code**: ~80 lines (mostly updates, not additions)
