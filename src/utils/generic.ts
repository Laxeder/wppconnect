/**
 * * Replace ID content
 * @param id
 */
export function replaceID(id: string): string {
  id = String(`${id}`).replace(/:(.*)@/, "@");

  if (id.includes("@s")) id = id.split("@")[0];

  return id.trim();
}

/**
 * * Get ID content
 * @param id
 */
export function getID(id: string): string {
  id = String(`${id}`);

  if (!id.includes("@")) id = `${id}@c.us`;

  return id.trim();
}

/**
 * * ID is group format
 * @param id
 */
export function isGroupId(id: string): boolean {
  return id.includes("@g");
}

/**
 * * ID is private format
 * @param id
 */
export function isPvId(id: string): boolean {
  return !id.includes("@") || id.includes("@c") || id.includes("@s");
}
