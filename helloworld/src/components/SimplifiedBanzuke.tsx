import type React from "react";
import { useState } from "react";
import {
  DragDropContext,
  Draggable,
  type DropResult,
  Droppable,
} from "react-beautiful-dnd";

interface Rikishi {
  id: string;
  name: string;
  rank: string;
  wins: number;
}

const initialRikishi: Rikishi[] = [
  { id: "1", name: "Terunofuji", rank: "Y1e", wins: 0 },
  { id: "2", name: "Hoshoryu", rank: "O1e", wins: 10 },
  { id: "3", name: "Kotozakura", rank: "O1w", wins: 11 },
  { id: "4", name: "Takakeisho", rank: "O2e", wins: 0 },
  { id: "5", name: "Kirishima", rank: "O2w", wins: 1 },
];

const SimplifiedBanzuke: React.FC = () => {
  const [rikishi, setRikishi] = useState<Rikishi[]>(initialRikishi);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(rikishi);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRikishi(items);
  };

  return (
    <div className="simplified-banzuke">
      <h2>Simplified Banzuke</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="rikishi">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {rikishi.map((wrestler, index) => (
                <Draggable
                  key={wrestler.id}
                  draggableId={wrestler.id}
                  index={index}
                >
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`rikishi-card ${wrestler.wins >= 8 ? "kachi-koshi" : "make-koshi"}`}
                    >
                      <span className="rank">{wrestler.rank}</span>
                      <span className="name">{wrestler.name}</span>
                      <span className="wins">
                        {wrestler.wins}-{15 - wrestler.wins}
                      </span>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default SimplifiedBanzuke;
