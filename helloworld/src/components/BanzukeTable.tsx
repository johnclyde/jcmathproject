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
  losses: number;
}

interface BanzukeTableProps {
  initialRikishi: Rikishi[];
}

const BanzukeTable: React.FC<BanzukeTableProps> = ({ initialRikishi }) => {
  const [rikishi, setRikishi] = useState<Rikishi[]>(initialRikishi);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(rikishi);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRikishi(items);
  };

  const getPerformanceClass = (wins: number) => {
    return wins >= 8 ? "kachi-koshi" : "make-koshi";
  };

  return (
    <div className="banzuke-table">
      <h2>Banzuke Table</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="rikishi">
          {(provided) => (
            <table {...provided.droppableProps} ref={provided.innerRef}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {rikishi.map((wrestler, index) => (
                  <Draggable
                    key={wrestler.id}
                    draggableId={wrestler.id}
                    index={index}
                  >
                    {(provided) => (
                      <tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`rikishi-row ${getPerformanceClass(wrestler.wins)}`}
                      >
                        <td>{wrestler.rank}</td>
                        <td>{wrestler.name}</td>
                        <td>
                          {wrestler.wins}-{wrestler.losses}
                        </td>
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            </table>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default BanzukeTable;
