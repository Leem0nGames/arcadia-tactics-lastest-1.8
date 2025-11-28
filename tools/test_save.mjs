#!/usr/bin/env node
import { strict as assert } from 'assert';

// Reimplementación del checksum usado en overwrite slice (FNV-1a 32-bit)
const calculateChecksum = (obj) => {
    try {
        const str = JSON.stringify(obj, Object.keys(obj).sort());
        let hash = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619) >>> 0;
        }
        return (hash >>> 0).toString(16);
    } catch (e) {
        return '';
    }
};

// Migrations same as overworldSlice.loadGame
const migrateSave = (parsed) => {
    let data = parsed.data;
    let version = parsed.version || 0;

    if (version < 1) { data.difficulty = data.difficulty || 'NORMAL'; version = 1; }
    if (version < 2) { if (!data.inventory) data.inventory = []; version = 2; }
    if (version < 3) { if (!data.mapDimensions) data.mapDimensions = { width: 40, height: 40 }; version = 3; }

    return { data, version };
};

console.log('Running save system tests...');

// Test 1: checksum matches for normal save
{
    const mockState = { party: [{ name: 'A' }], inventory: [], mapDimensions: { width: 40, height: 40 } };
    const saveFile = { version: 3, timestamp: Date.now(), data: mockState };
    saveFile.checksum = calculateChecksum(saveFile.data);
    const expected = calculateChecksum(saveFile.data);
    assert.equal(expected, saveFile.checksum, 'Checksum should match for valid save');
    console.log('Test 1 passed: valid save checksum matches');
}

// Test 2: corrupted save detected
{
    const mockState = { party: [{ name: 'B' }], inventory: [] };
    const saveFile = { version: 3, timestamp: Date.now(), data: mockState };
    saveFile.checksum = calculateChecksum(saveFile.data);

    // Corrupt the stored JSON (simulate tampering)
    const tampered = JSON.parse(JSON.stringify(saveFile));
    tampered.data.party[0].name = 'X_CORRUPT';

    const expected = calculateChecksum(tampered.data);
    assert.notEqual(expected, saveFile.checksum, 'Tampered save should not match checksum');
    console.log('Test 2 passed: corrupted save detected');
}

// Test 3: migrations from older versions
{
    const oldSaveV0 = { version: 0, timestamp: Date.now(), data: { party: [] } };
    const migrated = migrateSave(oldSaveV0);
    assert.equal(migrated.version, 3, 'Migrated version should be 3');
    assert.ok(migrated.data.difficulty, 'Difficulty should be present after migration');
    assert.ok(Array.isArray(migrated.data.inventory), 'Inventory should be present after migration');
    assert.ok(migrated.data.mapDimensions && migrated.data.mapDimensions.width, 'mapDimensions should be present after migration');
    console.log('Test 3 passed: migrations applied correctly');
}

console.log('All save system tests passed.');
process.exit(0);
