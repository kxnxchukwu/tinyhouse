import React, { useState } from "react";

export const FunctionComponent = () => {
  const [superhero, updateSuperhero] = useState(
    "Spider-Man"
  );

  return (
    <div>
      <h2>{superhero}</h2>
      <button
        onClick={() =>
          updateSuperhero(
            (superhero: string) => `${superhero} + Iron Man`
          )
        }
      >
        Update Superhero!
      </button>
    </div>
  );
};
