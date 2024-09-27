import type React from "react";
import { useState } from "react";

interface Rikishi {
  id: string;
  name: string;
  rank: string;
  wins: number;
  losses: number;
  notes?: string;
}

interface RikishiDetailsProps {
  rikishi: Rikishi;
  onUpdate: (updatedRikishi: Rikishi) => void;
}

const RikishiDetails: React.FC<RikishiDetailsProps> = ({
  rikishi,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRikishi, setEditedRikishi] = useState(rikishi);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditedRikishi((prev) => ({
      ...prev,
      [name]:
        name === "wins" || name === "losses"
          ? Number.parseInt(value, 10)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(editedRikishi);
    setIsEditing(false);
  };

  return (
    <div className="rikishi-details">
      <h2>{rikishi.name}</h2>
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={editedRikishi.name}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="rank">Rank:</label>
            <input
              type="text"
              id="rank"
              name="rank"
              value={editedRikishi.rank}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="wins">Wins:</label>
            <input
              type="number"
              id="wins"
              name="wins"
              value={editedRikishi.wins}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="losses">Losses:</label>
            <input
              type="number"
              id="losses"
              name="losses"
              value={editedRikishi.losses}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="notes">Notes:</label>
            <textarea
              id="notes"
              name="notes"
              value={editedRikishi.notes || ""}
              onChange={handleInputChange}
            />
          </div>
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <div>
          <p>
            <strong>Rank:</strong> {rikishi.rank}
          </p>
          <p>
            <strong>Record:</strong> {rikishi.wins}-{rikishi.losses}
          </p>
          {rikishi.notes && (
            <p>
              <strong>Notes:</strong> {rikishi.notes}
            </p>
          )}
          <button onClick={() => setIsEditing(true)} type="submit">
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default RikishiDetails;
