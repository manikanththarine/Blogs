export function serializeDoc(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, password, ...rest } = obj;
  return { id: _id.toString(), ...rest };
}
