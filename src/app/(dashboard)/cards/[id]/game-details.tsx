import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface GameDetailsProps {
  pokemonDetails: {
    hp: number | null;
    types: string[];
    stage: string | null;
    evolvesFrom: string | null;
    weakness: string | null;
    resistance: string | null;
    retreatCost: number | null;
  } | null;
  yugiohDetails: {
    cardType: string | null;
    attribute: string | null;
    level: number | null;
    attack: number | null;
    defense: number | null;
    race: string | null;
    archetype: string | null;
  } | null;
  mtgDetails: {
    typeLine: string | null;
    manaCost: string | null;
    cmc: number | null;
    colors: string[];
    oracleText: string | null;
    power: string | null;
    toughness: string | null;
    loyalty: string | null;
  } | null;
  onepieceDetails: {
    cardType: string | null;
    color: string | null;
    cost: number | null;
    power: number | null;
    counter: number | null;
    attribute: string | null;
  } | null;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

export function GameDetails({ pokemonDetails, yugiohDetails, mtgDetails, onepieceDetails }: GameDetailsProps) {
  return (
    <>
      {pokemonDetails && (
        <Card>
          <CardHeader><CardTitle>Pokemon Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {pokemonDetails.hp && <DetailRow label="HP">{pokemonDetails.hp}</DetailRow>}
              {pokemonDetails.types.length > 0 && <DetailRow label="Types">{pokemonDetails.types.join(", ")}</DetailRow>}
              {pokemonDetails.stage && <DetailRow label="Stage">{pokemonDetails.stage}</DetailRow>}
              {pokemonDetails.evolvesFrom && <DetailRow label="Evolves From">{pokemonDetails.evolvesFrom}</DetailRow>}
              {pokemonDetails.weakness && <DetailRow label="Weakness">{pokemonDetails.weakness}</DetailRow>}
              {pokemonDetails.resistance && <DetailRow label="Resistance">{pokemonDetails.resistance}</DetailRow>}
              {pokemonDetails.retreatCost !== null && <DetailRow label="Retreat Cost">{pokemonDetails.retreatCost}</DetailRow>}
            </dl>
          </CardContent>
        </Card>
      )}

      {yugiohDetails && (
        <Card>
          <CardHeader><CardTitle>Yu-Gi-Oh! Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {yugiohDetails.cardType && <DetailRow label="Type">{yugiohDetails.cardType}</DetailRow>}
              {yugiohDetails.attribute && <DetailRow label="Attribute">{yugiohDetails.attribute}</DetailRow>}
              {yugiohDetails.level !== null && <DetailRow label="Level">{yugiohDetails.level}</DetailRow>}
              {yugiohDetails.attack !== null && <DetailRow label="ATK / DEF">{yugiohDetails.attack} / {yugiohDetails.defense}</DetailRow>}
              {yugiohDetails.race && <DetailRow label="Race">{yugiohDetails.race}</DetailRow>}
              {yugiohDetails.archetype && <DetailRow label="Archetype">{yugiohDetails.archetype}</DetailRow>}
            </dl>
          </CardContent>
        </Card>
      )}

      {mtgDetails && (
        <Card>
          <CardHeader><CardTitle>Magic Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {mtgDetails.typeLine && <DetailRow label="Type">{mtgDetails.typeLine}</DetailRow>}
              {mtgDetails.manaCost && <DetailRow label="Mana Cost">{mtgDetails.manaCost}</DetailRow>}
              {mtgDetails.cmc !== null && <DetailRow label="CMC">{mtgDetails.cmc}</DetailRow>}
              {mtgDetails.colors.length > 0 && <DetailRow label="Colors">{mtgDetails.colors.join(", ")}</DetailRow>}
              {mtgDetails.oracleText && (
                <>
                  <dt className="text-muted-foreground">Text</dt>
                  <dd className="col-span-2 whitespace-pre-line">{mtgDetails.oracleText}</dd>
                </>
              )}
              {mtgDetails.power && <DetailRow label="P/T">{mtgDetails.power}/{mtgDetails.toughness}</DetailRow>}
              {mtgDetails.loyalty && <DetailRow label="Loyalty">{mtgDetails.loyalty}</DetailRow>}
            </dl>
          </CardContent>
        </Card>
      )}

      {onepieceDetails && (
        <Card>
          <CardHeader><CardTitle>One Piece Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {onepieceDetails.cardType && <DetailRow label="Type">{onepieceDetails.cardType}</DetailRow>}
              {onepieceDetails.color && <DetailRow label="Color">{onepieceDetails.color}</DetailRow>}
              {onepieceDetails.cost !== null && <DetailRow label="Cost">{onepieceDetails.cost}</DetailRow>}
              {onepieceDetails.power !== null && <DetailRow label="Power">{onepieceDetails.power}</DetailRow>}
              {onepieceDetails.counter !== null && <DetailRow label="Counter">{onepieceDetails.counter}</DetailRow>}
              {onepieceDetails.attribute && <DetailRow label="Attribute">{onepieceDetails.attribute}</DetailRow>}
            </dl>
          </CardContent>
        </Card>
      )}
    </>
  );
}
